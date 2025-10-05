const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NNS System", function () {
  let registry, resolver, registrar;
  let owner, user1, user2;
  let nexNamehash;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Registry
    const NNSRegistry = await ethers.getContractFactory("NNSRegistry");
    registry = await NNSRegistry.deploy();
    await registry.waitForDeployment();

    // Deploy Resolver
    const PublicResolver = await ethers.getContractFactory("PublicResolver");
    resolver = await PublicResolver.deploy(await registry.getAddress());
    await resolver.waitForDeployment();

    // Set up .nex TLD
    nexNamehash = ethers.namehash("nex");
    const nexLabel = ethers.id("nex");
    await registry.setSubnodeOwner(ethers.ZeroHash, nexLabel, owner.address);

    // Deploy Registrar
    const NexRegistrar = await ethers.getContractFactory("NexRegistrar");
    registrar = await NexRegistrar.deploy(
      await registry.getAddress(),
      await resolver.getAddress(),
      nexNamehash
    );
    await registrar.waitForDeployment();

    // Transfer .nex ownership to registrar
    await registry.setOwner(nexNamehash, await registrar.getAddress());
    await registry.setResolver(nexNamehash, await resolver.getAddress());
  });

  describe("Domain Registration", function () {
    it("Should register a new domain", async function () {
      const name = "alice";
      const duration = 365 * 24 * 60 * 60; // 1 year
      const fee = await registrar.registrationFee();

      await expect(
        registrar.connect(user1).register(name, user1.address, duration, { value: fee })
      ).to.emit(registrar, "DomainRegistered");

      const [domainOwner, expires, exists] = await registrar.getDomain(name);
      expect(domainOwner).to.equal(user1.address);
      expect(exists).to.be.true;
    });

    it("Should not register domain with insufficient payment", async function () {
      const name = "bob";
      const duration = 365 * 24 * 60 * 60;
      const fee = await registrar.registrationFee();

      await expect(
        registrar.connect(user1).register(name, user1.address, duration, { value: fee - 1n })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not register reserved names", async function () {
      const name = "admin";
      const duration = 365 * 24 * 60 * 60;
      const fee = await registrar.registrationFee();

      await expect(
        registrar.connect(user1).register(name, user1.address, duration, { value: fee })
      ).to.be.revertedWith("Name is reserved");
    });

    it("Should check domain availability", async function () {
      const name = "charlie";
      expect(await registrar.available(name)).to.be.true;

      const duration = 365 * 24 * 60 * 60;
      const fee = await registrar.registrationFee();
      await registrar.connect(user1).register(name, user1.address, duration, { value: fee });

      expect(await registrar.available(name)).to.be.false;
    });
  });

  describe("Domain Resolution", function () {
    beforeEach(async function () {
      const name = "alice";
      const duration = 365 * 24 * 60 * 60;
      const fee = await registrar.registrationFee();
      await registrar.connect(user1).register(name, user1.address, duration, { value: fee });
    });

    it("Should resolve domain to address", async function () {
      const namehash = await registrar.namehash("alice");
      const resolvedAddress = await resolver.addr(namehash);
      expect(resolvedAddress).to.equal(user1.address);
    });

    it("Should allow owner to update address", async function () {
      const namehash = await registrar.namehash("alice");
      await resolver.connect(user1).setAddr(namehash, user2.address);
      
      const resolvedAddress = await resolver.addr(namehash);
      expect(resolvedAddress).to.equal(user2.address);
    });
  });

  describe("Domain Transfer", function () {
    beforeEach(async function () {
      const name = "alice";
      const duration = 365 * 24 * 60 * 60;
      const fee = await registrar.registrationFee();
      await registrar.connect(user1).register(name, user1.address, duration, { value: fee });
    });

    it("Should transfer domain ownership", async function () {
      const name = "alice";
      
      await expect(
        registrar.connect(user1).transfer(name, user2.address)
      ).to.emit(registrar, "DomainTransferred");

      const [domainOwner] = await registrar.getDomain(name);
      expect(domainOwner).to.equal(user2.address);
    });

    it("Should not allow non-owner to transfer", async function () {
      const name = "alice";
      
      await expect(
        registrar.connect(user2).transfer(name, user2.address)
      ).to.be.revertedWith("Not domain owner");
    });
  });
});