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

const range = (
  start,
  stop
) => {
  return [...Array(stop - start)].map((_, i) => {
    return start + i
  })
}

;(async () => {
  const highestBlockNumber = await l2Provider.getBlockNumber()
  console.log('pulling all txs until', highestBlockNumber)
  let currentBlockNumber = 0
  const txs = []
  while (currentBlockNumber < highestBlockNumber) {
    try {
      const targetBlockNumber = Math.min(
        currentBlockNumber + MAX_BLOCKS_PER_LOOP,
        highestBlockNumber
      )

      console.log(`Loading blocks ${currentBlockNumber} - ${targetBlockNumber}`)
      const blocks = await Promise.all(
        range(currentBlockNumber, targetBlockNumber + 1).reduce((blockPromises, i) => {
          blockPromises.push(
           l2Provider.send('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]),
          )
          return blockPromises
        }, [])
      )

      for (const block of blocks) {
        txs.push(block.transactions[0])
      }
      currentBlockNumber = targetBlockNumber
    } catch (err) {
      console.log(`Caught an error trying to load blocks. Trying again in 5s. ${err}`)
      await sleep(5000)
    }
  }
  fs.writeFile('mainnet-txs.json', JSON.stringify(txs), (err) => {
    if (err) {
        throw err;
    }
    console.log("JSON data is saved.");
  })
})()
