import Router from 'koa-router'
import upload from './upload'

const router = new Router()

router.use(upload.routes())

export default router
