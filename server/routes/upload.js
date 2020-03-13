import Router from 'koa-router'
import multer from '@koa/multer'
import { parse } from '../lib/csv'

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
    async (ctx, next) => {
      const { Bill, Categories } = ctx.db
      const target = { bill: Bill, categories: Categories }
      try {
        const { type } = ctx.request.body
        const str = ctx.file.buffer.toString()

        let csvHeader = null

        const records = await parse(str, {
          columns: header => {
            csvHeader = header.join(',')
            return header
          }
        })

        const Model = target[type]

        if (csvHeader !== Model.csvHeader) throw new Error('表格表头格式有误，请检查后重新上传')

        const result = await Model.bulkCreate(records, {
          validate: true,
          logging: true
        })
        ctx.io.update()
        ctx.success(result)
      } catch (error) {
        ctx.error(500, error.message)
      }
    }
  )

export default uploadRouter
