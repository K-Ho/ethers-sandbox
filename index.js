'use strict';

require('dotenv-safe').config();
const { wrap } = require('synthetix');
const path = require('path');
const { gray, green, red } = require('chalk');
const fs = require('fs');
const {
	Contract,
	ContractFactory,
  providers: { JsonRpcProvider },
  utils: {hexZeroPad, id},
	Wallet,
} = require('ethers');
const { getContractInterface } = require('@eth-optimism/contracts/build/src/contract-defs')
const VERIFIER_URL = 'http://localhost:8045'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const optimismURL = process.env.L2_URL
const l1URL = process.env.L1_URL
const l2Provider = new JsonRpcProvider(optimismURL)
const verifierProvider = new JsonRpcProvider(VERIFIER_URL)
const l1Provider = new JsonRpcProvider(l1URL)

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
    console.log('adding touched accounts from block number', i)
    const verifierBlock = await verifierProvider.send('eth_getBlockByNumber', [`0x${i.toString(16)}`, true])
    touchedAccounts.add(verifierBlock.transactions[0].from)
    touchedAccounts.add(verifierBlock.transactions[0].to)
  }
  touchedAccounts.delete(null) //remove `null` which is the `to` for Contract creations
  const touchedAccountsArr = Array.from(touchedAccounts)
  console.log(JSON.stringify(touchedAccountsArr))

  // Check SNX and sUSD balances
  // Setup common constants
	const network = 'mainnet';
	const useOvm = true;
	const contract1 = 'Synthetix';

	const { getVersions, getSource } = wrap({ network, useOvm, fs, path });

	// Connect to the version's Synthetix contract
	const sources = getSource({ contract1, network, useOvm });
	const Synthetix = new Contract('0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', sources['ProxyERC20'].abi, l2Provider);
	const ProxyERC20sUSD = new Contract('0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9', sources['ProxyERC20'].abi, l2Provider);

	const verifier_Synthetix = new Contract('0xD85eAFa37734E4ad237C3A3443D64DC94ae998E7', sources['ProxyERC20'].abi, verifierProvider);
	const verifier_ProxyERC20sUSD = new Contract('0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9', sources['ProxyERC20'].abi, verifierProvider);

	let numMatchingAccounts = 0
	let mismatchedAccounts = []
	for (const account of touchedAccountsArr) {
		const snxBalance = (await Synthetix.balanceOf(account, {blockTag: latestVerifierBlockNum})).toString()
		const sUSDBalance = (await ProxyERC20sUSD.balanceOf(account, {blockTag: latestVerifierBlockNum})).toString()
		const verifier_snxBalance = (await verifier_Synthetix.balanceOf(account, {blockTag: latestVerifierBlockNum})).toString()
		const verifier_sUSDBalance = (await verifier_ProxyERC20sUSD.balanceOf(account, {blockTag: latestVerifierBlockNum})).toString()
		if (sUSDBalance === verifier_sUSDBalance && snxBalance === verifier_snxBalance) {
			console.log('Address:', account)
			console.log(`SNX balance: Seq-${snxBalance}, Ver-${verifier_snxBalance}`)
			console.log(`sUSD balance: Seq-${sUSDBalance}, Ver-${verifier_sUSDBalance}`)
			numMatchingAccounts++
		} else {
			mismatchedAccounts.push(account)
			if (snxBalance !== verifier_snxBalance) {
				console.error(`ERROR: mismatched snx balance: ${snxBalance} in Sequencer, but ${verifier_snxBalance} in Verifier`)
			}
			if (sUSDBalance !== verifier_sUSDBalance) {
				console.error(`ERROR: mismatched sUSD balance: ${sUSDBalance} in Sequencer, but ${verifier_sUSDBalance} in Verifier`)
			}
		}
		console.log(numMatchingAccounts, 'out of', touchedAccountsArr.length, 'matching!')
	}
	console.log('~~~DONE!~~~')
	console.log(numMatchingAccounts, 'out of', touchedAccountsArr.length, 'matching!')
	console.log('Mismatched accounts:', mismatchedAccounts)
})()
