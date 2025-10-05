// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NNSRegistry.sol";
import "./PublicResolver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Nex Registrar
 * @dev Manages registration of .nex domains
 */
contract NexRegistrar is Ownable, ReentrancyGuard {
    NNSRegistry public immutable registry;
    PublicResolver public immutable resolver;
    
    bytes32 public immutable baseNode; // namehash of "nex"
    
    uint256 public registrationFee = 0.01 ether; // Fee in NEX
    uint256 public constant MIN_REGISTRATION_DURATION = 365 days;
    uint256 public constant MAX_REGISTRATION_DURATION = 10 * 365 days;
    
    struct Domain {
        address owner;
        uint256 expires;
        bool exists;
    }
    
    mapping(bytes32 => Domain) public domains;
    mapping(string => bool) public reserved;
    
    // Events
    event DomainRegistered(string indexed name, bytes32 indexed label, address indexed owner, uint256 expires);
    event DomainRenewed(string indexed name, bytes32 indexed label, uint256 expires);
    event DomainTransferred(string name, bytes32 indexed label, address indexed from, address indexed to);
    event RegistrationFeeChanged(uint256 oldFee, uint256 newFee);
    
    modifier onlyDomainOwner(string memory name) {
        bytes32 label = keccak256(bytes(name));
        require(domains[label].owner == msg.sender, "Not domain owner");
        _;
    }
    
    modifier validName(string memory name) {
        require(bytes(name).length >= 3, "Name too short");
        require(bytes(name).length <= 63, "Name too long");
        require(!reserved[name], "Name is reserved");
        require(isValidName(name), "Invalid characters in name");
        _;
    }
    
    constructor(
        NNSRegistry _registry,
        PublicResolver _resolver,
        bytes32 _baseNode
    ) Ownable(msg.sender) {
        registry = _registry;
        resolver = _resolver;
        baseNode = _baseNode;
        
        // Reserve some common names
        reserved["www"] = true;
        reserved["mail"] = true;
        reserved["ftp"] = true;
        reserved["admin"] = true;
        reserved["root"] = true;
        reserved["nexus"] = true;
    }
    
    /**
     * @dev Setup function to authorize this registrar after receiving base node ownership
     * This must be called after the registrar receives ownership of the base node
     */
    function setupAuthorization() external onlyOwner {
        // Since this registrar owns the base node, it should be able to manage it directly
        // The issue might be that we need to ensure the registrar can act on behalf of itself
        // Let's verify the base node ownership first
        require(registry.owner(baseNode) == address(this), "Registrar must own base node");
    }
    
    /**
     * @dev Register a new .nex domain
     * @param name The domain name (without .nex)
     * @param owner The address that will own the domain
     * @param duration Registration duration in seconds
     */
    function register(
        string calldata name,
        address owner,
        uint256 duration
    ) external payable validName(name) nonReentrant {
        require(duration >= MIN_REGISTRATION_DURATION, "Duration too short");
        require(duration <= MAX_REGISTRATION_DURATION, "Duration too long");
        require(msg.value >= registrationFee, "Insufficient payment");
        
        bytes32 label = keccak256(bytes(name));
        require(!domains[label].exists || domains[label].expires < block.timestamp, "Domain already registered");
        
        uint256 expires = block.timestamp + duration;
        
        // Update domain record
        domains[label] = Domain({
            owner: owner,
            expires: expires,
            exists: true
        });
        
        // Set up NNS records
        bytes32 node = keccak256(abi.encodePacked(baseNode, label));
        // First create the subnode with registrar as owner
        registry.setSubnodeOwner(baseNode, label, address(this));
        // Set resolver and TTL while registrar owns the node
        registry.setResolver(node, address(resolver));
        registry.setTTL(node, uint64(expires));
        // Finally transfer ownership to the user
        registry.setOwner(node, owner);
        
        // Set resolver record
        resolver.setAddr(node, owner);
        
        emit DomainRegistered(name, label, owner, expires);
        
        // Refund excess payment
        if (msg.value > registrationFee) {
            payable(msg.sender).transfer(msg.value - registrationFee);
        }
    }
    
    /**
     * @dev Renew an existing domain
     * @param name The domain name
     * @param duration Additional duration in seconds
     */
    function renew(string calldata name, uint256 duration) external payable nonReentrant {
        require(duration >= MIN_REGISTRATION_DURATION, "Duration too short");
        require(duration <= MAX_REGISTRATION_DURATION, "Duration too long");
        require(msg.value >= registrationFee, "Insufficient payment");
        
        bytes32 label = keccak256(bytes(name));
        require(domains[label].exists, "Domain does not exist");
        require(domains[label].expires > block.timestamp, "Domain expired");
        
        domains[label].expires += duration;
        
        emit DomainRenewed(name, label, domains[label].expires);
        
        // Refund excess payment
        if (msg.value > registrationFee) {
            payable(msg.sender).transfer(msg.value - registrationFee);
        }
    }
    
    /**
     * @dev Transfer domain ownership
     * @param name The domain name
     * @param to The new owner address
     */
    function transfer(string calldata name, address to) external onlyDomainOwner(name) {
        require(to != address(0), "Invalid address");
        
        bytes32 label = keccak256(bytes(name));
        require(domains[label].expires > block.timestamp, "Domain expired");
        
        address from = domains[label].owner;
        domains[label].owner = to;
        
        // Update NNS ownership
        bytes32 node = keccak256(abi.encodePacked(baseNode, label));
        registry.setOwner(node, to);
        
        emit DomainTransferred(name, label, from, to);
    }
    
    /**
     * @dev Check if a domain is available for registration
     * @param name The domain name
     * @return available True if available
     */
    function available(string calldata name) external view returns (bool) {
        if (bytes(name).length < 3 || bytes(name).length > 63) return false;
        if (reserved[name]) return false;
        if (!isValidName(name)) return false;
        
        bytes32 label = keccak256(bytes(name));
        return !domains[label].exists || domains[label].expires < block.timestamp;
    }
    
    /**
     * @dev Get domain information
     * @param name The domain name
     * @return owner The domain owner
     * @return expires The expiration timestamp
     * @return exists Whether the domain exists
     */
    function getDomain(string calldata name) external view returns (address owner, uint256 expires, bool exists) {
        bytes32 label = keccak256(bytes(name));
        Domain memory domain = domains[label];
        return (domain.owner, domain.expires, domain.exists);
    }
    
    /**
     * @dev Set registration fee (only owner)
     * @param newFee The new registration fee
     */
    function setRegistrationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = registrationFee;
        registrationFee = newFee;
        emit RegistrationFeeChanged(oldFee, newFee);
    }
    
    /**
     * @dev Reserve or unreserve a name (only owner)
     * @param name The name to reserve/unreserve
     * @param isReserved Whether to reserve the name
     */
    function setReserved(string calldata name, bool isReserved) external onlyOwner {
        reserved[name] = isReserved;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Check if a name contains only valid characters
     * @param name The name to check
     * @return valid True if valid
     */
    function isValidName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        
        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            
            // Allow a-z, 0-9, and hyphen (but not at start or end)
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x61 && char <= 0x7A) || // a-z
                (char == 0x2D && i > 0 && i < nameBytes.length - 1) // hyphen not at start/end
            )) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev Generate namehash for a .nex domain
     * @param name The domain name
     * @return The namehash
     */
    function namehash(string calldata name) external view returns (bytes32) {
        bytes32 label = keccak256(bytes(name));
        return keccak256(abi.encodePacked(baseNode, label));
    }
}