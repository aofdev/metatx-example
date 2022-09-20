const { expect } = require("chai");
const { ethers } = require("hardhat");
const { signMetaTxRequest } = require("../../src/signer");

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

describe("contracts/AssetToken", function() {
  beforeEach(async function() {
    this.forwarder = await deploy('MinimalForwarder');
    this.assetToken = await deploy("AssetToken", "BUSD", "BUSD", this.forwarder.address);    
    this.accounts = await ethers.getSigners();
  });

  it("assetToken a mint directly", async function() {
    const owner = this.accounts[0];
    const assetToken = this.assetToken.connect(owner);
    
    await assetToken.mint(ethers.utils.parseEther("10")).then(tx => tx.wait());


    expect(await assetToken.totalSupply()).to.equal(ethers.utils.parseEther("10"))

    await assetToken.burn(ethers.utils.parseEther("2")).then(tx => tx.wait());

    expect(await assetToken.totalSupply()).to.equal(ethers.utils.parseEther("8"))
  });

  it("assetToken a mint via a meta-tx", async function() {

    const owner = this.accounts[0];
    const signer = this.accounts[2];
    const relayer = this.accounts[3];
    const forwarder = this.forwarder.connect(relayer);

    const assetToken = this.assetToken.connect(owner);
    
    const { request, signature } = await signMetaTxRequest(signer.provider, forwarder, {
      from: signer.address,
      to: this.assetToken.address,
      data: this.assetToken.interface.encodeFunctionData('mint', [ethers.utils.parseEther("10")]),
    });
    await forwarder.execute(request, signature).then(tx => tx.wait());


    expect(await assetToken.totalSupply()).to.equal(ethers.utils.parseEther("10"))

  });
});
