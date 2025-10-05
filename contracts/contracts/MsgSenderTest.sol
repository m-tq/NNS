// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MsgSenderReceiver {
    address public lastSender;
    
    function recordSender() external {
        lastSender = msg.sender;
    }
    
    function getLastSender() external view returns (address) {
        return lastSender;
    }
}

contract MsgSenderCaller {
    MsgSenderReceiver public receiver;
    
    constructor(address _receiver) {
        receiver = MsgSenderReceiver(_receiver);
    }
    
    function callReceiver() external {
        receiver.recordSender();
    }
    
    function getReceiverLastSender() external view returns (address) {
        return receiver.getLastSender();
    }
}