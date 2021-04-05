'use strict';

require('dotenv-safe').config();
const fs = require('fs')

const { gray, green, red } = require('chalk');
const {
  providers: { JsonRpcProvider },
} = require('ethers');
const MAX_BLOCKS_PER_LOOP = 1000

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const optimismURL = process.env.L2_URL
const l2Provider = new JsonRpcProvider(optimismURL)

;(async () => {
  const txs = require('./mainnet-txs.json')
  const methodIds = {}
  for (const tx of txs) {
    if(!tx) continue;
    const methodId = tx.input.slice(2,10)
    methodIds[methodId] = (methodIds[methodId]+1) || 1 ;
  }
  console.log(methodIds)
})()
