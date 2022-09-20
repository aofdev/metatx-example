/* eslint-disable no-unused-vars */
import { ethers } from 'ethers';

const MAIN_ENDPOINT = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const QUICKNODE_ENDPOINT = process.env.REACT_APP_QUICKNODE_URL;

export function createProvider() {  
  return new ethers.providers.JsonRpcProvider(QUICKNODE_ENDPOINT || MAIN_ENDPOINT, 97);
}