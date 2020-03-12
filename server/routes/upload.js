import Router from 'koa-router'
import multer from '@koa/multer'
import csvParse from 'csv-parse'

const uploadRouter = new Router()
const upload = multer()

uploadRouter
  .prefix('/upload')
  .post(
    '/categories',
    upload.single('categories'),
    (ctx, next) => {
      const str = ctx.file.buffer.toString()
      console.log('str', str)
      ctx.success('done')
    }
  )
  .post(
    '/bill',
    upload.single('bill'),
    (ctx, next) => {
      console.log('ctx.request.file', ctx.request.file)
      console.log('ctx.file', ctx.file)
      console.log('ctx.request.body', ctx.request.body)
      ctx.success('done')
    }
  )

export default uploadRouter
