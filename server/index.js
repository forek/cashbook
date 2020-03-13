import http from 'http'
import path from 'path'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import session, { Store } from 'koa-session2'
import argv from 'argv'
import koaStatic from 'koa-static'
import socketIo from 'socket.io'

import * as middleware from './middleware'
import DataBaseManager from './db/index'
import routes from './routes/index'
import SocketManager from './lib/socket_manager'

const app = new Koa()
const server = http.createServer(app.callback())
const io = socketIo(server)

const PUBLIC_PATH = path.join(__dirname, '../public/')
const args = argv.option([
  { name: 'port', type: 'int', short: 'p' }
]).run()
const currentPort = args.options.port || '3000'
const sessionStore = new Store()

app.context.db = new DataBaseManager()
app.context.io = new SocketManager({ io: io.of('cashbook'), db: app.context.db })

if (process.env.NODE_ENV === 'development') {
  const webpack = require('webpack')
  const config = require('../webpack.config.js')
  const compiler = webpack(config)
  app.use(require('koa-webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }))
  app.use(require('koa-webpack-hot-middleware')(compiler))
}

app.use(koaStatic(PUBLIC_PATH, {
  maxage: 365 * 24 * 60 * 60 * 1000
}))

app.use(session({ store: sessionStore }, app))

app.use(bodyParser())

middleware.apply(app, middleware.before);
(r => [app.use(r.routes()), app.use(r.allowedMethods())])(routes)
middleware.apply(app, middleware.after);

(async () => {
  await app.context.db.init()
  server.listen(currentPort)
  console.log(`-------- server started, listening port: ${currentPort} --------`)
})()
