import withApiAuth from '@xlnt/micro-api-auth'
import { IncomingMessage, ServerResponse } from 'http'
import pick = require('lodash/pick')
import {
  json,
  send,
} from 'micro'
import { post, router } from 'microrouter'

import Account = require('eth-lib/lib/account')
import RPC = require('eth-lib/lib/rpc')
import Transaction = require('eth-lib/lib/transaction')
import web3Utils = require('web3-utils')

const PRIVATE_KEY = process.env.PRIVATE_KEY
const NODE_ENDPOINT = process.env.NODE_ENDPOINT

const ethNode = RPC(NODE_ENDPOINT)
const me = Account.fromPrivate(PRIVATE_KEY)

const prefixMessage = (data) => {
  const message = web3Utils.isHexStrict(data) ? web3Utils.hexToBytes(data) : data
  const messageBuffer = Buffer.from(message)
  const preamble = '\x19Ethereum Signed Message:\n' + message.length
  const preambleBuffer = Buffer.from(preamble)
  const ethMessage = Buffer.concat([preambleBuffer, messageBuffer])
  return web3Utils.keccak256(ethMessage)
}

const recover = async (req: IncomingMessage, res: ServerResponse) => {
  const { message, signature } = await json(req)

  const messageHash = prefixMessage(message)
  const account = await Account.recover(messageHash, signature)

  send(res, 200, {
    account,
  })
}

const doSign = async (res: ServerResponse, message: string) => {
  const signature = await Account.sign(message, me.privateKey)
  // ^0xabcd

  send(res, 200, {
    signature,
  })
}

const sign = async (req: IncomingMessage, res: ServerResponse) => {
  const { message } = await json(req)

  await doSign(res, message)
}

const signHash = async (req: IncomingMessage, res: ServerResponse) => {
  const { message } = await json(req)

  const realMessage = web3Utils.soliditySha3(message)
  // ^ the hash of this data - should be removed for generic signatures
  const hash = prefixMessage(realMessage)
  // ^ keccack256(...Ethereum Signed Message:...)
  await doSign(res, hash)
}

const signAndSendTx = async (req: IncomingMessage, res: ServerResponse) => {
  const { tx } = await json(req)
  const txAllowed = pick(tx, ['to', 'value', 'data'])
  txAllowed.from = me.address

  const txWithDefaults = await Transaction.addDefaults(ethNode, txAllowed)
  const rawTxData = Transaction.sign(txWithDefaults, me)
  const hash = await ethNode('eth_sendRawTransaction', [rawTxData])
  if (hash.error) {
    throw new Error(`Error from ethNode: ${hash.error}`)
  }

  send(res, 200, {
    hash,
  })
}

const root = withApiAuth()(router(
  post('/recover', recover),
  post('/sign', sign),
  post('/signhash', signHash),
  post('/sign-and-send-tx', signAndSendTx),
))

export default root
