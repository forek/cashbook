import Router from 'koa-router'

const cashbook = new Router()

cashbook
  .prefix('/cashbook')
  .get('/status', async (ctx) => {
    const { Cashbook } = ctx.db
    ctx.success(await Cashbook.status())
  })

export default cashbook
