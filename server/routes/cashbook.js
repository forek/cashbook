import Router from 'koa-router'

const uploadRouter = new Router()

uploadRouter
  .prefix('/cashbook')
  .get('/status', () => {

  })

export default uploadRouter
