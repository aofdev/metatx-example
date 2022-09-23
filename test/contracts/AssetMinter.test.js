const { expect } = require("chai");
const { ethers } = require("hardhat");
const { signMetaTxRequest } = require("../../src/signer");

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then((f) => f.deployed());
}

describe("contracts/AssetMinter", function () {
  beforeEach(async function () {
    this.forwarder = await deploy("MinimalForwarder");
    this.assetToken = await deploy(
      "AssetToken",
      "Test USD",
      "tUSD",
      this.forwarder.address
    );
    this.accounts = await ethers.getSigners();
    this.minter = await deploy(
      "AssetMinter",
      this.assetToken.address,
      this.forwarder.address
    );
  });

  it("AssetMinter a mint a directly", async function () {
    const owner = this.accounts[0];
    const assets = this.accounts[1];
    const assetToken = this.assetToken.connect(owner);

    const minter = this.minter.connect(owner);

    await assetToken
      .mint(ethers.utils.parseEther("100"))
      .then((tx) => tx.wait());

    expect(await assetToken.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("100")
    );

    await assetToken.approve(minter.address, ethers.utils.parseEther("20"));

    await minter.mint(
      assets.address,
      ethers.utils.parseEther("2"),
      ethers.utils.parseEther("10")
    );
    expect(await assetToken.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("80")
    );
    expect(await assetToken.balanceOf(minter.address)).to.equal(
      ethers.utils.parseEther("20")
    );

    await assetToken
      .burn(ethers.utils.parseEther("20"))
      .then((tx) => tx.wait());

    expect(await assetToken.totalSupply()).to.equal(
      ethers.utils.parseEther("80")
    );
    expect(await assetToken.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("60")
    );
  });

  it("AssetMinter a mint via a meta-tx", async function () {
    const signer = this.accounts[3];
    const relayer = this.accounts[4];
    const assets = this.accounts[5];
    const forwarder = this.forwarder.connect(relayer);

    const assetToken = this.assetToken.connect(signer);

    const { request, signature } = await signMetaTxRequest(
      signer.provider,
      forwarder,
      {
        from: signer.address,
        to: this.assetToken.address,
        data: this.assetToken.interface.encodeFunctionData("mint", [
          ethers.utils.parseEther("100"),
        ]),
      }
    );
    await forwarder.execute(request, signature).then((tx) => tx.wait());

    expect(await assetToken.totalSupply()).to.equal(
      ethers.utils.parseEther("100")
    );

    const { request: requestApprove, signature: signatureApprove } =
      await signMetaTxRequest(signer.provider, forwarder, {
        from: signer.address,
        to: this.assetToken.address,
        data: this.assetToken.interface.encodeFunctionData("approve", [
          this.minter.address,
          ethers.utils.parseEther("20"),
        ]),
      });

    await forwarder
      .execute(requestApprove, signatureApprove)
      .then((tx) => tx.wait());

    const { request: requestMint, signature: signatureMint } =
      await signMetaTxRequest(signer.provider, forwarder, {
        from: signer.address,
        to: this.minter.address,
        data: this.minter.interface.encodeFunctionData("mint", [
          assets.address,
          ethers.utils.parseEther("2"),
          ethers.utils.parseEther("10"),
        ]),
      });
    await forwarder.execute(requestMint, signatureMint).then((tx) => tx.wait());

    expect(await assetToken.balanceOf(signer.address)).to.equal(
      ethers.utils.parseEther("80")
    );
    expect(await assetToken.balanceOf(this.minter.address)).to.equal(
      ethers.utils.parseEther("20")
    );
  });
});
