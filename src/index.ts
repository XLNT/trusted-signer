import Koa = require('koa')
import bodyParser = require('koa-bodyparser')

const app = new Koa()
app.use(bodyParser())

app.use((ctx) => {
  ctx.body = 'Hello Koa'
})

app.listen(3000)
