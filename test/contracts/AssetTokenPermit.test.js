const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fromRpcSig } = require("ethereumjs-util");
const ethSigUtil = require("eth-sig-util");
const Wallet = require("ethereumjs-wallet").default;
const {
  signMetaTxRequest,
  EIP712Domain,
  Permit,
  domainSeparator,
} = require("../../src/signer");
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
  time,
} = require("@openzeppelin/test-helpers");

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then((f) => f.deployed());
}

function buildData(
  name,
  chainId,
  version,
  contractAddress,
  deadline,
  owner,
  spender,
  value,
  nonce,
) {
  return ({
      primaryType: 'Permit',
      types: { EIP712Domain, Permit },
      domain: { name, version, chainId, verifyingContract: contractAddress },
      message: { owner, spender, value, nonce, deadline },
  });
}

describe("contracts/AssetTokenPermitPermit", function () {
  const wallet = Wallet.generate();
  const owner = wallet.getAddressString();
  const nonce = 0;
  const maxDeadline = ethers.BigNumber.from('2').pow(ethers.BigNumber.from('256')).sub(ethers.BigNumber.from('1')).toHexString();
  const name = "Test USD Permit";
  const symbol = "tUSDp";
  const version = "1";
  const initialSupply = ethers.utils.parseEther("100");

  beforeEach(async function () {
    this.forwarder = await deploy("MinimalForwarder");
    this.accounts = await ethers.getSigners();
    this.assetTokenPermit = await deploy(
      "AssetTokenPermit",
      name,
      symbol,
      this.accounts[0].address,
      initialSupply,
      this.forwarder.address
    );
    this.chainId = await this.assetTokenPermit.getChainId();
    this.minter = await deploy(
      "AssetMinter",
      this.assetTokenPermit.address,
      this.accounts[8].address, // vault
      this.accounts[9].address, // fee
      this.forwarder.address
    );
  });

  it("initial totalSupply is 100", async function () {
    expect(await this.assetTokenPermit.balanceOf(this.accounts[0].address)).to.equal(
      initialSupply
    );
  });

  it("initial nonce is 0", async function () {
    expect(
      await this.assetTokenPermit.nonces(this.accounts[0].address)
    ).to.equal(ethers.utils.parseEther("0"));
  });

  it("domain separator", async function () {
    expect(await this.assetTokenPermit.DOMAIN_SEPARATOR()).to.equal(
      await domainSeparator(
        name,
        version,
        parseInt(this.chainId),
        this.assetTokenPermit.address
      )
    );
  });

  it("accepts owner signature", async function () {
    const spender = this.accounts[1].address;
    const value = 42;
    const data = buildData(
      name,
      parseInt(this.chainId),
      version,
      this.assetTokenPermit.address,
      maxDeadline,
      owner,
      spender,
      value,
      nonce
    );
    const signature = fromRpcSig(ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    }));
    await this.assetTokenPermit.permit(
      owner,
      spender,
      value,
      maxDeadline,
      signature.v,
      signature.r,
      signature.s
    );

    expect(await this.assetTokenPermit.nonces(owner)).to.equal(
      "1"
    );
    expect(
      await this.assetTokenPermit.allowance(owner, spender)
    ).to.equal(value);
  });

  it("assetTokenPermit a mint via a meta-tx", async function () {
    const signer = this.accounts[1];
    const relayer = this.accounts[2];
    const forwarder = this.forwarder.connect(relayer);

    const assetTokenPermit = this.assetTokenPermit.connect(signer);

    const { request, signature } = await signMetaTxRequest(
      signer.provider,
      forwarder,
      {
        from: signer.address,
        to: assetTokenPermit.address,
        data: assetTokenPermit.interface.encodeFunctionData("mint", [
          ethers.utils.parseEther("100"),
        ]),
      }
    );
    await forwarder.execute(request, signature).then((tx) => tx.wait());

    expect(await assetTokenPermit.totalSupply()).to.equal(
      ethers.utils.parseEther("200")
    );

    const { request: requestBurn, signature: signatureBurn } = await signMetaTxRequest(
      signer.provider,
      forwarder,
      {
        from: signer.address,
        to: assetTokenPermit.address,
        data: assetTokenPermit.interface.encodeFunctionData("burn", [
          ethers.utils.parseEther("20"),
        ]),
      }
    );
    await forwarder.execute(requestBurn, signatureBurn).then((tx) => tx.wait());

    expect(await assetTokenPermit.balanceOf(signer.address)).to.equal(
      ethers.utils.parseEther("80")
    );
  });
});
