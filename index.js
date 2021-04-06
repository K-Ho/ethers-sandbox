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
let l1Addresses = {
  'Lib_AddressManager': '0x72e6F5244828C10737cbC9659378B207246D26B2'
}
let l2Addresses = {
  'OVM_ExecutionManager': '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0005',
  'OVM_L2CrossDomainMessenger': '0x4200000000000000000000000000000000000007',
}

const loadContract = (name, isL2) => {
  return new Contract(isL2 ? l2Addresses[name] : l1Addresses[name], getContractInterface(name), isL2 ? l2Wallet : l1Wallet)
}

;(async () => {
  const AddressManager  = loadContract('Lib_AddressManager', false)
  console.log('OVM_L1ETHGateway', await AddressManager.getAddress('OVM_L1ETHGateway'))
  console.log('Proxy__OVM_L1ETHGateway', await AddressManager.getAddress('Proxy__OVM_L1ETHGateway'))
  console.log('Proxy__OVM_L1CrossDomainMessenger', await AddressManager.getAddress('Proxy__OVM_L1CrossDomainMessenger'))
})()
