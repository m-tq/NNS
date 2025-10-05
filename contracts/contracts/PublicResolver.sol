// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NNSRegistry.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title Public Resolver
 * @dev A simple resolver that stores addresses for NNS domains
 */
contract PublicResolver is ERC165 {
    NNSRegistry public immutable registry;

    mapping(bytes32 => address) addresses;
    mapping(bytes32 => string) names;
    mapping(bytes32 => string) texts;
    mapping(bytes32 => bytes) contenthashes;

    // Events
    event AddrChanged(bytes32 indexed node, address a);
    event NameChanged(bytes32 indexed node, string name);
    event TextChanged(bytes32 indexed node, string indexed key, string value);
    event ContenthashChanged(bytes32 indexed node, bytes hash);

    modifier authorised(bytes32 node) {
        require(
            registry.owner(node) == msg.sender || 
            registry.isApprovedForAll(registry.owner(node), msg.sender),
            "Not authorised"
        );
        _;
    }

    constructor(NNSRegistry _registry) {
        registry = _registry;
    }

    /**
     * @dev Sets the address associated with an NNS node.
     * @param node The node to update.
     * @param a The address to set.
     */
    function setAddr(bytes32 node, address a) external authorised(node) {
        setAddr(node, 60, addressToBytes(a));
    }

    /**
     * @dev Sets the address associated with an NNS node for a specific coin type.
     * @param node The node to update.
     * @param coinType The coin type (60 for Ethereum).
     * @param a The address to set.
     */
    function setAddr(bytes32 node, uint256 coinType, bytes memory a) public authorised(node) {
        if (coinType == 60) {
            emit AddrChanged(node, bytesToAddress(a));
            addresses[node] = bytesToAddress(a);
        }
    }

    /**
     * @dev Sets the name associated with an NNS node, for reverse records.
     * @param node The node to update.
     * @param newName The name to set.
     */
    function setName(bytes32 node, string calldata newName) external authorised(node) {
        names[node] = newName;
        emit NameChanged(node, newName);
    }

    /**
     * @dev Sets the text data associated with an NNS node and key.
     * @param node The node to update.
     * @param key The key to set.
     * @param value The text data value to set.
     */
    function setText(bytes32 node, string calldata key, string calldata value) external authorised(node) {
        texts[keccak256(abi.encodePacked(node, key))] = value;
        emit TextChanged(node, key, value);
    }

    /**
     * @dev Sets the contenthash associated with an NNS node.
     * @param node The node to update.
     * @param hash The contenthash to set
     */
    function setContenthash(bytes32 node, bytes calldata hash) external authorised(node) {
        contenthashes[node] = hash;
        emit ContenthashChanged(node, hash);
    }

    /**
     * @dev Returns the address associated with an NNS node.
     * @param node The NNS node to query.
     * @return The associated address.
     */
    function addr(bytes32 node) public view returns (address) {
        return addresses[node];
    }

    /**
     * @dev Returns the address associated with an NNS node for a specific coin type.
     * @param node The NNS node to query.
     * @param coinType The coin type to query.
     * @return The associated address.
     */
    function addr(bytes32 node, uint256 coinType) public view returns (bytes memory) {
        if (coinType == 60) {
            return addressToBytes(addresses[node]);
        }
        return "";
    }

    /**
     * @dev Returns the name associated with an NNS node, for reverse records.
     * @param node The NNS node to query.
     * @return The associated name.
     */
    function name(bytes32 node) external view returns (string memory) {
        return names[node];
    }

    /**
     * @dev Returns the text data associated with an NNS node and key.
     * @param node The NNS node to query.
     * @param key The key to query.
     * @return The associated text data.
     */
    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return texts[keccak256(abi.encodePacked(node, key))];
    }

    /**
     * @dev Returns the contenthash associated with an NNS node.
     * @param node The NNS node to query.
     * @return The associated contenthash.
     */
    function contenthash(bytes32 node) external view returns (bytes memory) {
        return contenthashes[node];
    }

    /**
     * @dev Converts an address to bytes.
     * @param a The address to convert.
     * @return The address as bytes.
     */
    function addressToBytes(address a) internal pure returns (bytes memory) {
        return abi.encodePacked(a);
    }

    /**
     * @dev Converts bytes to an address.
     * @param b The bytes to convert.
     * @return The bytes as an address.
     */
    function bytesToAddress(bytes memory b) internal pure returns (address) {
        require(b.length == 20, "Invalid address length");
        address addr;
        assembly {
            addr := mload(add(b, 20))
        }
        return addr;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || super.supportsInterface(interfaceId);
    }
}