// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NNSRegistry.sol";

contract TestRegistrar {
    NNSRegistry public immutable registry;
    bytes32 public immutable baseNode;
    
    constructor(NNSRegistry _registry, bytes32 _baseNode) {
        registry = _registry;
        baseNode = _baseNode;
    }
    
    function testSetSubnodeOwner(bytes32 label, address owner) external {
        // This should work if the registrar owns the baseNode
        registry.setSubnodeOwner(baseNode, label, owner);
    }
    
    function getBaseNodeOwner() external view returns (address) {
        return registry.owner(baseNode);
    }
    
    function whoAmI() external view returns (address) {
        return address(this);
    }
}