# metatx-example

Using [OpenZeppelin Defender](https://openzeppelin.com/defender) Client API

## Structure

- `app`: React code for the client dapp, bootstrapped with create-react-app.
- `autotasks/relay`: Javascript code for the meta-transaction relay, to be run as a Defender Autotask, compiled using rollup.
- `contracts`: Solidity code for the AssetToken contract, compiled with [hardhat](https://hardhat.org/).
- `scripts`: Custom scripts for common tasks, such as uploading Autotask code, signing sample meta-txs, etc.
- `src`: Shared code for signing meta-txs and interacting with the Forwarder contract.
- `test`: Tests for contracts and Autotask.

## Scripts

- `yarn deploy`: Compiles and deploys the AssetToken and Forwarder contracts to Goerli, and writes their addresses in `deploy.json`.
- `yarn sign`: Signs a meta-tx requesting the mint and writes it to `tmp/request.json`.
- `yarn invoke`: Invokes the relay Autotask via `WEBHOOK_URL` with the contents of `tmp/request.json` generated by `yarn sign`.
- `yarn create-autotask`: Compiles and creates the Autotask and uploads the Autotask code.
- `yarn upload`: Compiles and uploads the Autotask code to `AUTOTASK_ID`.
- `yarn relay`: Runs the relay Autotask script locally, using the Defender Relayer for `RELAY_API_KEY`.
- `yarn test`: Runs tests for contracts and Autotask using hardhat.

## Environment

Expected `.env` file in the project root:

- `PRIVATE_KEY`: Private key used for signing meta-txs locally.
- `TEAM_API_KEY`: Defender Team API key, used for uploading autotask code.
- `TEAM_API_SECRET`: Defender Team API secret.

Expected `.env` file in `/app`:

- `REACT_APP_WEBHOOK_URL`: Webhook of the Autotask to invoke for relaying meta-txs.
- `REACT_APP_QUICKNODE_URL`: Optional URL to Quicknode for connecting to the BSC-testnet network from the dapp.

## Quick Start ⚡️

### Configure the project

Create a `.env` file in the project root

```js
PRIVATE_KEY="Private key used for signing meta-txs locally"
TEAM_API_KEY="Defender Team API key, used for uploading autotask code"
TEAM_API_SECRET="Defender Team API secret"
```

Store the value of a new private key in our projects `.env` file.

### Create Relayer

Create a relayer using [Defender Relay Client](https://docs.openzeppelin.com/defender/relay-api-reference) on BSC-testnet.

```js
yarn create-relay
```

This runs a script that creates a relayer and stores the relayer API key and API secret in the projects `.env` file.

### Deploy contracts

Use the newly created Relayer to deploy the MinimalForwarder and AssetToken contracts to BSC-testnet.

```js
yarn deploy
```

### Sign Using Relayer

Sign a request to mint, this will create a request in `tmp/request.json` that we can then view

```js
yarn sign
cat tmp/request.json
```

We can then use the script to send the request to our relayer, and [view the transaction on bscscan](https://testnet.bscscan.com).  We can also view number of mint.

```js
yarn relay
```

### Create Autotask

Create an [Autotask using Defender Client](https://docs.openzeppelin.com/defender/autotasks-api-reference), with a webhook trigger and connected to our BSC-testnet relayer.

```js
yarn create-autotask
```

This creates the autotask, saves the Autotask ID to the .env file [AUTO_TASK_ID]), and uploads the autotask code.

Grab the Autotask webhook from the web app and store in the apps `.env` file (in the `app` directory).

### Run app

We can then install dependencies using `yarn` and run the app.

```js
cd app
yarn install
yarn start
```

1. Open app: [http://localhost:3000/](http://localhost:3000/)
2. Change to BSC Testnet network in Metamask
3. Enter a number of mint and sign the metatransaction in MetaMask

## Resources

- [How to Relay Gasless Meta-Transactions](https://docs.openzeppelin.com/defender/guide-metatx)
- [Official Examples](https://github.com/OpenZeppelin/workshops/tree/master/25-defender-metatx-api)
