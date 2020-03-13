import Router from 'koa-router'

const io = new Router()

io
  .prefix('/io')
  .post('/join', async (ctx) => {
    ctx.io.of('cashbook')
    ctx.success('')
  })

export default io
