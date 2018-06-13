import withApiAuth from '@xlnt/micro-api-auth'
import { IncomingMessage, ServerResponse } from 'http'
import {
  json,
  send,
} from 'micro'
import { post, router } from 'microrouter'

import Account = require('eth-lib/lib/account')
import web3Utils = require('web3-utils')

const PRIVATE_KEY = process.env.PRIVATE_KEY

const prefixMessage = (data) => {
  const message = web3Utils.isHexStrict(data) ? web3Utils.hexToBytes(data) : data
  const messageBuffer = Buffer.from(message)
  const preamble = '\x19Ethereum Signed Message:\n' + message.length
  const preambleBuffer = Buffer.from(preamble)
  const ethMessage = Buffer.concat([preambleBuffer, messageBuffer])
  return web3Utils.keccak256(ethMessage)
}

const recover = async (req: IncomingMessage, res: ServerResponse) => {
  const {
    message,
    signature,
  } = await json(req)

  const messageHash = prefixMessage(message)

  const account = await Account.recover(
    messageHash,
    signature,
  )

  send(res, 200, {
    account,
  })
}

const doSign = async (res: ServerResponse, message: string) => {
  const signature = await Account.sign(
    message,
    PRIVATE_KEY,
  )
  // ^0xabcd

  send(res, 200, {
    signature,
  })
}

const sign = async (req: IncomingMessage, res: ServerResponse) => {
  const {
    message,
  } = await json(req)

  await doSign(res, message)
}

const signHash = async (req: IncomingMessage, res: ServerResponse) => {
  const {
    message,
  } = await json(req)

  const realMessage = web3Utils.soliditySha3(message)
  // ^ the hash of this data - should be removed for generic signatures
  const hash = prefixMessage(realMessage)
  // ^ keccack256(...Ethereum Signed Message:...)
  await doSign(res, hash)
}

const root = withApiAuth()(router(
  post('/recover', recover),
  post('/sign', sign),
  post('/signhash', signHash),
))

export default root
