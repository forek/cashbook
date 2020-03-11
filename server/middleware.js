import fs from 'fs'
import path from 'path'

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import App from '../app/index'

export const before = [
  // utils
  async (ctx, next) => {
    ctx.fail = function (msg) {
      this.type = 'application/json'
      this.body = { success: false, code: 1, result: msg }
    }

    ctx.success = function (paylod) {
      this.type = 'application/json'
      this.body = { success: true, code: 0, error: false, result: paylod }
    }

    ctx.send = function (body) {
      this.type = typeof body === 'object' ? 'application/json' : 'text/plain'
      this.body = body
    }

    ctx.error = function (code = 500, msg = 'unknow error') {
      this.status = code
      this.type = 'application/json'
      this.body = { success: false, code: 1, result: msg }
    }

    await next()
  }
]

export const after = [
  // render
  async (ctx, next) => {
    const context = {}

    const html = ReactDOMServer.renderToString(
      <StaticRouter location={ctx.url} context={context}>
        <App />
      </StaticRouter>
    )

    if (context.url) {
      ctx.status = 301
      ctx.redirect(context.url)
      ctx.body = `Redirecting to ${context.url}`
    } else {
      ctx.type = 'text/html'
      let body = fs.readFileSync(path.join(__dirname, '../app/view/index.html'), { encoding: 'utf8' })
      const assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../webpack-assets.json'), { encoding: 'utf8' }))

      body = body
        .replace('{{css}}', assets.index.css)
        .replace('{{js}}', assets.index.js)
        .replace('{{html}}', html)

      if (context.status) ctx.status = context.status
      ctx.body = body
    }
  }
]

export async function authorization (ctx, next) {
  if (!ctx.session.$user) return ctx.error('用户未登录.')
  await next()
}

export async function apply (app, mw) {
  if (Array.isArray(mw)) {
    mw.forEach(v => app.use(v))
  } else {
    app.use(mw)
  }
}