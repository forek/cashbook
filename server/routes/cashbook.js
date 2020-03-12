import Router from 'koa-router'

const uploadRouter = new Router()

uploadRouter
  .prefix('/cashbook')
  .get('/status', async (ctx) => {
    const { Cashbook } = ctx.db
    ctx.success(await Cashbook.status())
  })

export default uploadRouter
