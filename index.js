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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const optimismURL = process.env.L2_URL
const l1URL = process.env.L1_URL
const l2Provider = new JsonRpcProvider(optimismURL)
const l1Provider = new JsonRpcProvider(l1URL)

const l1Wallet = new Wallet(process.env.L1_USER_PRIVATE_KEY, l1Provider)
const l2Wallet = new Wallet(process.env.L2_USER_PRIVATE_KEY, l2Provider)
let l1Addresses = {
  'OVM_StateCommitmentChain': '0x9F5E5EaB38198cB384a2E5508bcFE7ab5f33D532'
}
let l2Addresses = {
  'OVM_ExecutionManager': '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0005',
  'OVM_L2CrossDomainMessenger': '0x4200000000000000000000000000000000000007',
}

const loadContract = (name, isL2) => {
  return new Contract(isL2 ? l2Addresses[name] : l1Addresses[name], getContractInterface(name), isL2 ? l2Provider : l1Provider)
}

;(async () => {
  const scc  = loadContract('OVM_StateCommitmentChain', false)
  console.log('scc addr', scc.address)
  const fpw = await scc.FRAUD_PROOF_WINDOW()
  console.log('fpw', fpw.toString())
  const batchHeader = {
    batchIndex: 65,
    batchRoot: '0xC798DBAD4AE3AF0CDA17EED9E08B8C2504D241AE1B078C59E9DBC04B6FC38ED5',
    batchSize: 1274,
    prevTotalElements: 23158,
    extraData: '0x00000000000000000000000000000000000000000000000000000000601C8EF00000000000000000000000008641BDD2CE2D4B4B2E9F0391F14DA414F66254CB',
  }
  const tx = await scc.connect(l1Wallet).deleteStateBatch(batchHeader, {gasLimit: 200000})
  const receipt = await tx.wait()
  console.log('deleted state batch. tx receipt:', receipt)
})()
