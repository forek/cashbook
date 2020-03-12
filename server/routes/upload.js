import Router from 'koa-router'
import multer from '@koa/multer'
import csvParse from 'csv-parse'

import { validator } from '../middleware'

const uploadRouter = new Router()
const upload = multer()

uploadRouter
  .prefix('/upload')
  .post(
    '/csv',
    upload.single('csv'),
    validator([
      ins => ins.body('type').isOneOf(['bill', 'categories']).isRequired()
    ]),
    (ctx, next) => {
      const { type } = ctx.request.body
      const str = ctx.file.buffer.toString()

      console.log('str', str)
      ctx.success('done')
    }
  )

export default uploadRouter
