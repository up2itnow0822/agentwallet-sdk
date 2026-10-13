// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

// Minimal independently declared protocol interfaces, matching the fixed integrations.
interface ISwapRouter02 {
    struct SwapRequest { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }
    function exactInputSingle(SwapRequest calldata request) external payable returns(uint256);
}
interface IAavePoolV3 {
    function supply(address token,uint256 amount,address onBehalfOf,uint16 referralCode) external;
    function withdraw(address token,uint256 amount,address to) external returns(uint256);
}
interface ITokenMessengerV2 {
    function depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken,bytes32 destinationCaller,uint256 maxFee,uint32 minFinalityThreshold) external;
}

/// @notice Non-upgradeable owner-controlled vault with bounded operator operations.
/// @dev Only standard owner-approved ERC20s and independently verified protocols are supported.
contract AgentVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error Unauthorized();
    error InvalidConfiguration();
    error InvalidAmount();
    error Paused();
    error ForbiddenTarget();
    error ForbiddenCalldata();
    error NoSpendPolicy();
    error BudgetExceeded();
    error InsufficientBalance();
    error InvalidPending();
    error StalePending();
    error ExternalCallFailed();
    error InvalidSwap();
    error InvalidProtocolResult();
    error InvalidBridge();

    address public immutable owner;
    address public immutable router;
    address public immutable aavePool;
    address public immutable tokenMessenger;
    uint32 public immutable sourceDomain;
    bool public paused;
    uint256 public policyEpoch;
    uint256 public pendingNonce;
    uint256 public constant MAX_PERIOD_LENGTH = 365 days;
    uint256 public constant MAX_SWAP_WINDOW = 1 hours;
    uint256 public constant PENDING_LIFETIME = 1 days;
    uint256 public constant MAX_OWNER_CALLDATA = 16384;

    struct SpendPolicy {
        uint256 perTx;
        uint256 periodLimit;
        uint256 periodLength;
        uint256 windowStart;
        uint256 spent;
    }
    struct SwapPair { uint256 minRateX18; uint256 validUntil; }
    struct Pending {
        address to;
        uint256 value;
        address token;
        uint256 amount;
        bytes data;
        uint256 createdAt;
        bool executed;
        bool cancelled;
        uint256 expiresAt;
        uint256 policyEpoch;
    }
    mapping(address => bool) private operators;
    mapping(address => bool) public recipients;
    mapping(address => SpendPolicy) public spendPolicies;
    mapping(address => mapping(address => SwapPair)) public swapPairs;
    mapping(uint32 => bytes32) public bridgeDestinations;
    mapping(address => uint256) public stakingPrincipal;
    mapping(uint256 => Pending) private pending;
    mapping(uint256 => address) private pendingCreators;

    event TransactionExecuted(address indexed target,uint256 value,address indexed executor);
    event TransactionQueued(uint256 indexed txId,address indexed to,uint256 value,address token,uint256 amount);
    event TransactionApproved(uint256 indexed txId);
    event TransactionCancelled(uint256 indexed txId);
    event SpendPolicySet(address indexed token,uint256 perTx,uint256 periodLimit,uint256 periodLength);
    event OperatorSet(address indexed operator,bool allowed);
    event RecipientSet(address indexed recipient,bool allowed);
    event SwapPairSet(address indexed tokenIn,address indexed tokenOut,uint256 minRateX18,uint256 validUntil);
    event BridgeDestinationSet(uint32 indexed domain,bytes32 recipient);
    event PausedSet(bool paused);

    constructor(address owner_,address operator_,address router_,address aavePool_,address tokenMessenger_,uint32 sourceDomain_) {
        if (owner_ == address(0) || operator_ == address(0) || operator_ == owner_) revert InvalidConfiguration();
        _verifyProtocol(router_); _verifyProtocol(aavePool_); _verifyProtocol(tokenMessenger_);
        owner=owner_; router=router_; aavePool=aavePool_; tokenMessenger=tokenMessenger_; sourceDomain=sourceDomain_;
        operators[operator_]=true;
        emit OperatorSet(operator_,true);
    }

    receive() external payable {}

    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }
    modifier authorizedOperation() {
        if (msg.sender != owner && !operators[msg.sender]) revert Unauthorized();
        if (paused) revert Paused();
        _;
    }

    function securityVersion() external pure returns(uint256) { return 1; }
    function isOperatorActive(address account) external view returns(bool) { return operators[account] && !paused; }

    function setOperator(address account,bool allowed) external onlyOwner nonReentrant {
        if (account == address(0) || account == owner || account == address(this)) revert InvalidConfiguration();
        operators[account]=allowed; ++policyEpoch; emit OperatorSet(account,allowed);
    }
    function setPaused(bool value) external onlyOwner nonReentrant {
        paused=value; ++policyEpoch; emit PausedSet(value);
    }
    function setRecipient(address recipient,bool allowed) external onlyOwner nonReentrant {
        _validateTarget(recipient);
        recipients[recipient]=allowed; ++policyEpoch; emit RecipientSet(recipient,allowed);
    }
    function setSpendPolicy(address token,uint256 perTx,uint256 periodLimit,uint256 periodLength) external onlyOwner nonReentrant {
        _validateToken(token,true);
        if (perTx == 0 && periodLimit == 0 && periodLength == 0) {
            delete spendPolicies[token];
        } else {
            if (perTx == 0 || periodLimit < perTx || periodLength == 0 || periodLength > MAX_PERIOD_LENGTH) revert InvalidConfiguration();
            spendPolicies[token]=SpendPolicy(perTx,periodLimit,periodLength,block.timestamp,0);
        }
        ++policyEpoch; emit SpendPolicySet(token,perTx,periodLimit,periodLength);
    }
    function setSwapPair(address tokenIn,address tokenOut,uint256 minRateX18,uint256 validUntil) external onlyOwner nonReentrant {
        _validateToken(tokenIn,false); _validateToken(tokenOut,false);
        if (tokenIn == tokenOut) revert InvalidConfiguration();
        if (minRateX18 == 0 && validUntil == 0) delete swapPairs[tokenIn][tokenOut];
        else {
            if (minRateX18 == 0 || validUntil <= block.timestamp) revert InvalidConfiguration();
            swapPairs[tokenIn][tokenOut]=SwapPair(minRateX18,validUntil);
        }
        ++policyEpoch; emit SwapPairSet(tokenIn,tokenOut,minRateX18,validUntil);
    }
    function setBridgeDestination(uint32 domain,bytes32 recipient) external onlyOwner nonReentrant {
        if (domain == sourceDomain) revert InvalidConfiguration();
        bridgeDestinations[domain]=recipient; ++policyEpoch; emit BridgeDestinationSet(domain,recipient);
    }

    function remainingBudget(address token) public view returns(uint256) {
        SpendPolicy storage p=spendPolicies[token];
        if (p.periodLength == 0) return 0;
        if (block.timestamp - p.windowStart >= p.periodLength) return p.periodLimit;
        return p.spent >= p.periodLimit ? 0 : p.periodLimit - p.spent;
    }

    /// @notice Native-only payment. Operator calldata is always forbidden.
    function agentExecute(address to,uint256 value,bytes calldata data) external authorizedOperation nonReentrant {
        if (data.length != 0) revert ForbiddenCalldata();
        _requireRecipient(to); _requirePolicy(address(0));
        if (value == 0) revert InvalidAmount();
        if (address(this).balance < value) revert InsufficientBalance();
        if (!_withinBudget(address(0),value)) { _queue(to,value,address(0),value,""); return; }
        _consume(address(0),value); _sendNative(to,value);
        emit TransactionExecuted(to,value,msg.sender);
    }
    function agentTransferToken(address token,address to,uint256 amount) external authorizedOperation nonReentrant {
        _requireRecipient(to); _requirePolicy(token); _validateToken(token,false);
        if (amount == 0) revert InvalidAmount();
        if (IERC20(token).balanceOf(address(this)) < amount) revert InsufficientBalance();
        if (!_withinBudget(token,amount)) { _queue(to,0,token,amount,abi.encodeCall(IERC20.transfer,(to,amount))); return; }
        _consume(token,amount); _transferExact(token,to,amount);
        emit TransactionExecuted(to,0,msg.sender);
    }

    function agentSwap(address tokenIn,address tokenOut,uint256 amountIn,uint256 minimumOut,uint24 fee,uint256 deadline)
        external authorizedOperation nonReentrant returns(uint256 received)
    {
        _requireProtocol(router); _validateToken(tokenIn,false); _validateToken(tokenOut,false);
        _requirePolicy(tokenIn); _requirePolicy(tokenOut);
        SwapPair storage pair=swapPairs[tokenIn][tokenOut];
        if (tokenIn == tokenOut || pair.minRateX18 == 0 || block.timestamp > pair.validUntil ||
            deadline < block.timestamp || deadline > block.timestamp + MAX_SWAP_WINDOW || deadline > pair.validUntil ||
            (fee != 100 && fee != 500 && fee != 3000 && fee != 10000) || minimumOut == 0) revert InvalidSwap();
        if (minimumOut < Math.mulDiv(amountIn,pair.minRateX18,1e18,Math.Rounding.Ceil)) revert InvalidSwap();
        _consume(tokenIn,amountIn);
        uint256 beforeIn=IERC20(tokenIn).balanceOf(address(this));
        uint256 beforeOut=IERC20(tokenOut).balanceOf(address(this));
        IERC20(tokenIn).forceApprove(router,amountIn);
        uint256 reported=ISwapRouter02(router).exactInputSingle(ISwapRouter02.SwapRequest(tokenIn,tokenOut,fee,address(this),amountIn,minimumOut,0));
        IERC20(tokenIn).forceApprove(router,0);
        _verifyDebit(tokenIn,beforeIn,amountIn);
        received=_credit(tokenOut,beforeOut);
        if (received < minimumOut || reported != received) revert InvalidProtocolResult();
        emit TransactionExecuted(router,0,msg.sender);
    }

    function agentSupply(address token,uint256 amount) external authorizedOperation nonReentrant {
        _requireProtocol(aavePool); _validateToken(token,false); _consume(token,amount);
        uint256 beforeBalance=IERC20(token).balanceOf(address(this));
        IERC20(token).forceApprove(aavePool,amount);
        IAavePoolV3(aavePool).supply(token,amount,address(this),0);
        IERC20(token).forceApprove(aavePool,0);
        _verifyDebit(token,beforeBalance,amount);
        stakingPrincipal[token] += amount;
        emit TransactionExecuted(aavePool,0,msg.sender);
    }

    function agentWithdraw(address token,uint256 amount) external authorizedOperation nonReentrant returns(uint256 received) {
        _requireProtocol(aavePool); _validateToken(token,false); _consume(token,amount);
        uint256 beforeBalance=IERC20(token).balanceOf(address(this));
        uint256 reported=IAavePoolV3(aavePool).withdraw(token,amount,address(this));
        received=_credit(token,beforeBalance);
        if (received == 0 || received > amount || received != reported) revert InvalidProtocolResult();
        uint256 principal=stakingPrincipal[token];
        stakingPrincipal[token]=received >= principal ? 0 : principal - received;
        emit TransactionExecuted(aavePool,0,msg.sender);
    }

    function agentBridge(address token,uint256 amount,uint32 destinationDomain,bytes32 recipient,uint256 maxFee,uint32 minFinalityThreshold)
        external authorizedOperation nonReentrant
    {
        _requireProtocol(tokenMessenger); _validateToken(token,false);
        if (destinationDomain == sourceDomain || recipient == bytes32(0) || recipient != bridgeDestinations[destinationDomain] ||
            maxFee >= amount || (minFinalityThreshold != 1000 && minFinalityThreshold != 2000)) revert InvalidBridge();
        _consume(token,amount);
        uint256 beforeBalance=IERC20(token).balanceOf(address(this));
        IERC20(token).forceApprove(tokenMessenger,amount);
        ITokenMessengerV2(tokenMessenger).depositForBurn(amount,destinationDomain,recipient,token,bytes32(0),maxFee,minFinalityThreshold);
        IERC20(token).forceApprove(tokenMessenger,0);
        _verifyDebit(token,beforeBalance,amount);
        emit TransactionExecuted(tokenMessenger,0,msg.sender);
    }

    function getPending(uint256 id) external view returns(Pending memory) {
        if (id >= pendingNonce) revert InvalidPending();
        return pending[id];
    }
    function approvePending(uint256 id) external onlyOwner nonReentrant {
        if (paused) revert Paused();
        Pending storage p=_livePending(id);
        if (p.policyEpoch != policyEpoch || block.timestamp > p.expiresAt) revert StalePending();
        address creator=pendingCreators[id];
        if (creator != owner && !operators[creator]) revert StalePending();
        _requireRecipient(p.to); _requirePolicy(p.token);
        // Mark before external interaction; any failure rolls this back atomically.
        p.executed=true;
        if (p.token == address(0)) {
            if (p.data.length != 0 || p.value != p.amount) revert InvalidPending();
            _sendNative(p.to,p.value);
        } else {
            if (p.value != 0 || keccak256(p.data) != keccak256(abi.encodeCall(IERC20.transfer,(p.to,p.amount)))) revert InvalidPending();
            _transferExact(p.token,p.to,p.amount);
        }
        emit TransactionApproved(id); emit TransactionExecuted(p.to,p.value,msg.sender);
    }
    function cancelPending(uint256 id) external onlyOwner nonReentrant {
        Pending storage p=_livePending(id); p.cancelled=true; emit TransactionCancelled(id);
    }
    /// @notice Explicit owner recovery/control; never available to operator identities.
    function ownerExecute(address to,uint256 value,bytes calldata data) external onlyOwner nonReentrant returns(bytes memory result) {
        if (to == address(0) || to == address(this)) revert ForbiddenTarget();
        if (data.length > MAX_OWNER_CALLDATA || (data.length != 0 && to.code.length == 0)) revert ForbiddenCalldata();
        (bool ok,bytes memory returned)=to.call{value:value}(data);
        if (!ok) revert ExternalCallFailed();
        emit TransactionExecuted(to,value,msg.sender); return returned;
    }

    function _requireProtocol(address target) private view { if (target == address(0) || target.code.length == 0) revert InvalidConfiguration(); }
    function _transferExact(address token,address to,uint256 amount) private {
        uint256 beforeVault=IERC20(token).balanceOf(address(this));
        uint256 beforeRecipient=IERC20(token).balanceOf(to);
        IERC20(token).safeTransfer(to,amount);
        _verifyDebit(token,beforeVault,amount);
        uint256 afterRecipient=IERC20(token).balanceOf(to);
        if (afterRecipient < beforeRecipient || afterRecipient - beforeRecipient != amount) revert InvalidProtocolResult();
    }
    function _verifyDebit(address token,uint256 beforeBalance,uint256 amount) private view {
        uint256 afterBalance=IERC20(token).balanceOf(address(this));
        if (afterBalance > beforeBalance || beforeBalance - afterBalance != amount) revert InvalidProtocolResult();
    }
    function _credit(address token,uint256 beforeBalance) private view returns(uint256) {
        uint256 afterBalance=IERC20(token).balanceOf(address(this));
        if (afterBalance < beforeBalance) revert InvalidProtocolResult();
        return afterBalance - beforeBalance;
    }
    function _verifyProtocol(address target) private view { if (target != address(0) && target.code.length == 0) revert InvalidConfiguration(); }
    function _validateToken(address token,bool allowNative) private view {
        if (token == address(0)) { if (!allowNative) revert InvalidConfiguration(); return; }
        if (token == address(this) || token.code.length == 0 || token == router || token == aavePool || token == tokenMessenger) revert InvalidConfiguration();
    }
    function _validateTarget(address to) private view {
        if (to == address(0) || to == address(this) || to == router || to == aavePool || to == tokenMessenger) revert ForbiddenTarget();
    }
    function _requireRecipient(address to) private view { _validateTarget(to); if (!recipients[to]) revert ForbiddenTarget(); }
    function _requirePolicy(address token) private view { if (spendPolicies[token].periodLength == 0) revert NoSpendPolicy(); }
    function _withinBudget(address token,uint256 amount) private view returns(bool) { return amount <= spendPolicies[token].perTx && amount <= remainingBudget(token); }
    function _consume(address token,uint256 amount) private {
        if (amount == 0) revert InvalidAmount();
        _requirePolicy(token);
        if (!_withinBudget(token,amount)) revert BudgetExceeded();
        SpendPolicy storage p=spendPolicies[token];
        if (block.timestamp - p.windowStart >= p.periodLength) {
            p.windowStart += ((block.timestamp - p.windowStart) / p.periodLength) * p.periodLength;
            p.spent=0;
        }
        p.spent += amount;
    }
    function _queue(address to,uint256 value,address token,uint256 amount,bytes memory data) private {
        uint256 id=pendingNonce++;
        pending[id]=Pending(to,value,token,amount,data,block.timestamp,false,false,block.timestamp+PENDING_LIFETIME,policyEpoch);
        pendingCreators[id]=msg.sender;
        emit TransactionQueued(id,to,value,token,amount);
    }
    function _livePending(uint256 id) private view returns(Pending storage p) {
        if (id >= pendingNonce) revert InvalidPending();
        p=pending[id]; if (p.executed || p.cancelled) revert InvalidPending();
    }
    function _sendNative(address to,uint256 value) private {
        (bool ok,)=to.call{value:value}(""); if (!ok) revert ExternalCallFailed();
    }
}
