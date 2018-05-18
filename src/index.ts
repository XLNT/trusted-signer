import dotenv = require('dotenv')
dotenv.config()

import Koa = require('koa')
import bodyParser = require('koa-bodyparser')
import logger = require('koa-logger')
import Router = require('koa-router')

import Account = require('eth-lib/lib/account')
import web3Utils = require('web3-utils')

const PRIVATE_KEY = process.env.PRIVATE_KEY
const PORT = process.env.PORT || 3000

const prefixMessage = (data) => {
  const message = web3Utils.isHexStrict(data) ? web3Utils.hexToBytes(data) : data
  const messageBuffer = Buffer.from(message)
  const preamble = '\x19Ethereum Signed Message:\n' + message.length
  const preambleBuffer = Buffer.from(preamble)
  const ethMessage = Buffer.concat([preambleBuffer, messageBuffer])
  return web3Utils.keccak256(ethMessage)
}

const main = async () => {
  const app = new Koa()
  const router = new Router()

  router.post('/recover', async (ctx) => {
    const {
      message,
      signature,
    } = ctx.request.body

    const messageHash = prefixMessage(message)

    const account = await Account.recover(
      messageHash,
      signature,
    )

    ctx.body = {
      account,
    }
  })

  router.post('/sign', async (ctx) => {
    const {
      message,
      // ^ 0xabcd
    } = ctx.request.body

    const realMessage = web3Utils.soliditySha3(message)
    // ^ the hash of this data - should be removed for generic signatures
    const hash = prefixMessage(realMessage)
    // ^ keccack256(...Ethereum Signed Message:...)
    const signature = await Account.sign(
      hash,
      PRIVATE_KEY,
    )
    // ^0xabcd

    ctx.body = {
      signature,
    }
  })

  app
    .use(bodyParser())
    .use(logger())
    .use(router.routes())
    .use(router.allowedMethods())

  app.listen(PORT, () => {
    console.log(`[trusted-signer] running on port ${PORT}`)
  })

}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
