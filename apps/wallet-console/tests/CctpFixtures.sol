// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;
// Local browser-test protocol fixtures only. Not a Circle implementation or deployment.
contract BrowserUSDC {
 string public constant symbol="USDC";uint8 public constant decimals=6;
 mapping(address=>uint256) public balanceOf;mapping(address=>mapping(address=>uint256)) public allowance;
 function mint(address to,uint256 n) external {balanceOf[to]+=n;}
 function approve(address to,uint256 n) external returns(bool){allowance[msg.sender][to]=n;return true;}
 function transfer(address to,uint256 n) external returns(bool){balanceOf[msg.sender]-=n;balanceOf[to]+=n;return true;}
 function transferFrom(address from,address to,uint256 n) external returns(bool){allowance[from][msg.sender]-=n;balanceOf[from]-=n;balanceOf[to]+=n;return true;}
}
contract BrowserTransmitter {
 mapping(bytes32=>uint256) public usedNonces;event MessageSent(bytes message);
 function localDomain() external pure returns(uint32){return 0;}
 function emitMessage(bytes calldata message) external {emit MessageSent(message);}
 function receiveMessage(bytes calldata message,bytes calldata) external returns(bool){bytes32 nonce;uint256 amount;bytes32 recipient;uint256 fee;assembly{nonce:=calldataload(add(message.offset,12)) recipient:=calldataload(add(message.offset,184)) amount:=calldataload(add(message.offset,216)) fee:=calldataload(add(message.offset,312))}require(usedNonces[nonce]==0,"already minted");usedNonces[nonce]=1;BrowserUSDC(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238).mint(address(uint160(uint256(recipient))),amount-fee);return true;}
}
contract BrowserMessenger {
 function depositForBurn(uint256 amount,uint32 domain,bytes32 recipient,address token,bytes32 caller,uint256 fee,uint32 finality) external {BrowserUSDC(token).transferFrom(msg.sender,address(this),amount);bytes memory message=abi.encodePacked(uint32(1),uint32(6),domain,bytes32(0),bytes32(uint256(uint160(address(this)))),bytes32(uint256(uint160(address(this)))),caller,finality,uint32(0),uint32(1),bytes32(uint256(uint160(token))),recipient,amount,bytes32(uint256(uint160(msg.sender))),fee,uint256(0),uint256(0));BrowserTransmitter(0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275).emitMessage(message);}
}
