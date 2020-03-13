import Router from 'koa-router'

import io from './io'
import cashbook from './cashbook'
import upload from './upload'

const router = new Router()

router
  .prefix('/api')
  .use(io.routes())
  .use(cashbook.routes())
  .use(upload.routes())

export default router
