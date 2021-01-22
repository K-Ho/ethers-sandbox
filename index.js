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
  let start = 0
  let finish = latestVerifierBlockNum
  while (start !== finish) {
    let i = Math.floor((start + finish)/2)
    const sequencerBlock = await l2Provider.send('eth_getBlockByNumber', [`0x${i.toString(16)}`, true])
    const verifierBlock = await verifierProvider.send('eth_getBlockByNumber', [`0x${i.toString(16)}`, true])
    if (sequencerBlock.stateRoot === verifierBlock.stateRoot) {
      start = i
      console.log(`matching state roots for block ${i}: ${sequencerBlock.stateRoot}`)
    } else {
      finish = i
      console.error(`ERROR: MISMATCHED STATE ROOTS AT BLOCK ${i}. Sequencer has state root: ${sequencerBlock.stateRoot}. Verifier has state root:  ${verifierBlock.stateRoot}`)
    }
  }
  // const response = await axios.get(`${DEPLOYER_URL}/addresses.json`);
  // l1Addresses = response.data;
  // console.log('geth chain Id', (await l2Provider.getNetwork()).chainId)
  // const ExecutionManager  = s loadContract('OVM_ExecutionManager', true)
  // console.log('EM addr', ExecutionManager.address)
  // console.log('executionManager chain id', (await ExecutionManager.ovmCHAINID()).toString())
  // hexZeroPad(currentWallet, 32)
  // const L2Messenger  = loadContract('OVM_L2CrossDomainMessenger', true)
  // console.log(await L2Messenger.xDomainMessageSender())


  // const filter = {
  //   address: '0x5A081fa7e3483504385e7C804AB1509499e2A408',
  //   topics: [id(`WithdrawalInitiated(address,uint256)`), hexZeroPad('0xe75103858b0b02b76DD78250442DE26e5Ac331D9', 32)],
  //   fromBlock: 0,
  // };
  // const logs = await l2Provider.getLogs(filter);
  // console.log('located in block #', logs[0].blockNumber)
})()
