const {
  DefenderRelayProvider,
  DefenderRelaySigner,
} = require('defender-relay-client/lib/ethers')
const { ethers } = require('hardhat')
const { writeFileSync } = require('fs')

async function main() {
  require('dotenv').config()
  const credentials = {
    apiKey: process.env.RELAYER_API_KEY,
    apiSecret: process.env.RELAYER_API_SECRET,
  }
  const provider = new DefenderRelayProvider(credentials)
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: 'fast',
  })
  const vault_address = process.env.VAULT_ADDRESS
  const fee_address = process.env.FEE_ADDRESS

  const Forwarder = await ethers.getContractFactory('MinimalForwarder')
  const forwarder = await Forwarder.connect(relaySigner)
    .deploy()
    .then((f) => f.deployed())

  const AssetToken = await ethers.getContractFactory('AssetToken')
  const assetToken = await AssetToken.connect(relaySigner)
    .deploy("Asset Token 3", "aToken3", forwarder.address)
    .then((f) => f.deployed())

  const AssetMinter = await ethers.getContractFactory('AssetMinter')
  const assetMinter = await AssetMinter.connect(relaySigner)
    .deploy(assetToken.address, vault_address, fee_address, forwarder.address)
    .then((f) => f.deployed())

  writeFileSync(
    'deploy.json',
    JSON.stringify(
      {
        MinimalForwarder: forwarder.address,
        AssetToken: assetToken.address,
        AssetMinter: assetMinter.address,
      },
      null,
      2
    )
  )

  console.log(
    `MinimalForwarder: ${forwarder.address}\n AssetToken: ${assetToken.address}`
  )
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
