// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint256 public mode;
    address public attackTarget;
    bytes public attackData;
    constructor() ERC20("Disposable test token", "TEST") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
    function configure(uint256 m, address target, bytes calldata data) external { mode=m; attackTarget=target; attackData=data; }
    function _update(address from,address to,uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            require(mode != 1, "token reverted");
            if (mode == 2) { (bool ok,) = attackTarget.call(attackData); require(ok,"token reentrancy blocked"); }
        }
        if (from != address(0) && to != address(0) && mode == 3) super._update(from,address(0),1);
        if (from != address(0) && to != address(0) && mode == 4) {
            super._update(from,address(0),1);
            super._update(from,to,amount-1);
        } else super._update(from,to,amount);
    }
}
interface IV3 {
    struct Params { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }
}
contract TestRouter {
    uint256 public mode;
    address public attackTarget;
    bytes public attackData;
    uint256 public observedAllowance;
    address public observedRecipient;
    function configure(uint256 m,address target,bytes calldata data) external { mode=m; attackTarget=target; attackData=data; }
    function exactInputSingle(IV3.Params calldata p) external payable returns(uint256) {
        observedAllowance=TestToken(p.tokenIn).allowance(msg.sender,address(this));
        observedRecipient=p.recipient;
        TestToken(p.tokenIn).transferFrom(msg.sender,address(this),mode==4 ? p.amountIn / 2 : p.amountIn);
        require(mode != 1,"router reverted");
        if(mode==2) { (bool ok,)=attackTarget.call(attackData); require(ok,"router reentrancy blocked"); }
        uint256 actual=mode==3 ? 1 : p.amountIn * 2;
        TestToken(p.tokenOut).mint(p.recipient,actual);
        return p.amountIn * 2;
    }
}
contract TestPool {
    uint256 public mode;
    uint256 public observedAllowance;
    address public observedBeneficiary;
    mapping(address => mapping(address => uint256)) public supplied;
    function configure(uint256 m) external { mode=m; }
    function supply(address token,uint256 amount,address beneficiary,uint16) external {
        observedAllowance=TestToken(token).allowance(msg.sender,address(this));
        observedBeneficiary=beneficiary;
        TestToken(token).transferFrom(msg.sender,address(this),amount);
        require(mode!=1,"pool reverted");
        supplied[token][beneficiary]+=amount;
    }
    function withdraw(address token,uint256 amount,address to) external returns(uint256) {
        observedBeneficiary=to;
        require(mode!=1,"pool reverted");
        uint256 actual=mode==2 ? amount/2 : amount;
        supplied[token][msg.sender]-=actual;
        TestToken(token).transfer(to,actual);
        return mode==3 ? amount+1 : actual;
    }
}
contract TestMessenger {
    uint256 public mode;
    uint256 public observedAllowance;
    bytes32 public observedRecipient;
    bytes32 public observedCaller;
    uint32 public observedDomain;
    uint32 public observedFinality;
    uint256 public observedFee;
    function configure(uint256 m) external { mode=m; }
    function depositForBurn(uint256 amount,uint32 domain,bytes32 recipient,address token,bytes32 caller,uint256 fee,uint32 finality) external {
        observedAllowance=TestToken(token).allowance(msg.sender,address(this));
        observedRecipient=recipient; observedCaller=caller; observedDomain=domain; observedFinality=finality; observedFee=fee;
        TestToken(token).transferFrom(msg.sender,address(this),amount);
        require(mode!=1,"burn reverted");
    }
}
contract TestReceiver {
    address public attackTarget;
    bytes public attackData;
    bool public reject;
    function configure(address target,bytes calldata data,bool r) external { attackTarget=target; attackData=data; reject=r; }
    receive() external payable {
        require(!reject,"recipient reverted");
        if(attackTarget!=address(0)) { (bool ok,)=attackTarget.call(attackData); require(ok,"receiver reentrancy blocked"); }
    }
}
