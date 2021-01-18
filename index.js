'use strict';

require('dotenv-safe').config();

const { gray, green, red } = require('chalk');
const {
	Contract,
	ContractFactory,
  providers: { JsonRpcProvider },
  utils: {hexZeroPad, id},
	Wallet,
} = require('ethers');
const { getContractInterface } = require('@eth-optimism/contracts/build/src/contract-defs')
const axios = require('axios');
const DEPLOYER_URL = 'http://localhost:8080';
const VERIFIER_URL = 'http://localhost:8045'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const optimismURL = process.env.L2_URL
const l1URL = process.env.L1_URL
const l2Provider = new JsonRpcProvider(optimismURL)
const verifierProvider = new JsonRpcProvider(VERIFIER_URL)
const l1Provider = new JsonRpcProvider(l1URL)

const l1Wallet = new Wallet(process.env.L1_USER_PRIVATE_KEY, l1Provider)
const l2Wallet = new Wallet(process.env.L2_USER_PRIVATE_KEY, l2Provider)
let l1Addresses
let l2Addresses = {
  'OVM_ExecutionManager': '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0005',
  'OVM_L2CrossDomainMessenger': '0x4200000000000000000000000000000000000007'
}

const loadContract = (name, isL2) => {
  return new Contract(isL2 ? l2Addresses[name] : l1Addresses[name], getContractInterface(name), isL2 ? l2Provider : l1Provider)
}

;(async () => {
  const latestVerifierBlockNum = await verifierProvider.getBlockNumber()
  console.log('latestVerifierBlockNum', latestVerifierBlockNum)
  let touchedAccounts = new Set()
  for (let i = 1; i <= latestVerifierBlockNum; i++) {
    const verifierBlock = await verifierProvider.send('eth_getBlockByNumber', [`0x${i.toString(16)}`, true])
    touchedAccounts.add(verifierBlock.transactions[0].from)
    touchedAccounts.add(verifierBlock.transactions[0].to)
  }
  touchedAccounts.delete(null) //remove `null` which is the `to` for Contract creations
  const output = Array.from(touchedAccounts)
  console.log(JSON.stringify(output))
})()
