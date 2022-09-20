import { ethers } from 'ethers';
import { createInstance } from './forwarder';
import { signMetaTxRequest } from './signer';

async function sendTx(assetToken, mint) {
  console.log(`Sending mint tx to number: ${mint}`);
  return assetToken.mint(ethers.utils.parseEther(mint));
}

async function sendMetaTx(assetToken, provider, signer, mint) {
  console.log(`Sending mint meta-tx to number: ${mint}`);
  const url = process.env.REACT_APP_WEBHOOK_URL;
  if (!url) throw new Error(`Missing relayer url`);

  const forwarder = createInstance(provider);
  const from = await signer.getAddress();
  const data = assetToken.interface.encodeFunctionData('mint', [ethers.utils.parseEther(mint)]);
  const to = assetToken.address;
  
  const request = await signMetaTxRequest(
    signer.provider,
    forwarder.connect(signer),
    {
      to,
      from,
      data,
    }
  );

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function minter(assetToken, provider, mint) {
  if (!mint) throw new Error(`Mint cannot be empty`);
  if (!window.ethereum) throw new Error(`User wallet not found`);

  await window.ethereum.enable();
  const userProvider = new ethers.providers.Web3Provider(window.ethereum);
  const userNetwork = await userProvider.getNetwork();
  if (userNetwork.chainId !== 97) throw new Error(`Please switch to BSC Testnet for signing`);

  const signer = userProvider.getSigner();
  const from = await signer.getAddress();
  const balance = await provider.getBalance(from);
  
  const canSendTx = balance.gt(1e15);
  if (canSendTx) return sendTx(assetToken.connect(signer), mint);
  else return sendMetaTx(assetToken, provider, signer, mint);
}
