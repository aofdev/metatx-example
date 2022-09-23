const { expect } = require("chai");
const { ethers } = require("hardhat");
const { signMetaTxRequest } = require("../../src/signer");

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then((f) => f.deployed());
}

describe("contracts/AssetToken", function () {
  beforeEach(async function () {
    this.forwarder = await deploy("MinimalForwarder");
    this.assetToken = await deploy(
      "AssetToken",
      "Test USD",
      "tUSD",
      this.forwarder.address
    );
    this.accounts = await ethers.getSigners();
  });

  it("AssetToken a mint directly", async function () {
    const owner = this.accounts[0];
    const assetToken = this.assetToken.connect(owner);

    await assetToken
      .mint(ethers.utils.parseEther("100"))
      .then((tx) => tx.wait());

    expect(await assetToken.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("100")
    );
   
    await assetToken
      .burn(ethers.utils.parseEther("20"))
      .then((tx) => tx.wait());

    expect(await assetToken.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("80")
    );
  });

  it("AssetToken a mint via a meta-tx", async function () {
    const signer = this.accounts[1];
    const relayer = this.accounts[2];
    const forwarder = this.forwarder.connect(relayer);

    const assetToken = this.assetToken.connect(signer);

    const { request, signature } = await signMetaTxRequest(
      signer.provider,
      forwarder,
      {
        from: signer.address,
        to: assetToken.address,
        data: assetToken.interface.encodeFunctionData("mint", [
          ethers.utils.parseEther("100"),
        ]),
      }
    );
    await forwarder.execute(request, signature).then((tx) => tx.wait());

    expect(await assetToken.totalSupply()).to.equal(
      ethers.utils.parseEther("100")
    );

    const { request: requestBurn, signature: signatureBurn } = await signMetaTxRequest(
      signer.provider,
      forwarder,
      {
        from: signer.address,
        to: assetToken.address,
        data: assetToken.interface.encodeFunctionData("burn", [
          ethers.utils.parseEther("20"),
        ]),
      }
    );
    await forwarder.execute(requestBurn, signatureBurn).then((tx) => tx.wait());

    expect(await assetToken.balanceOf(signer.address)).to.equal(
      ethers.utils.parseEther("80")
    );
  });
});
