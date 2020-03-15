import Router from 'koa-router'
import { validator } from '../middleware'

const cashbook = new Router()

cashbook
  .prefix('/cashbook')
  .post(
    '/bill/create',
    validator([
      ins => ins.body('time').isNumber().isRequired(),
      ins => ins.body('type').isNumber().isOneOf([0, 1]).isRequired(),
      ins => ins.body('category').isString(),
      ins => ins.body('amount').isNumber().isRequired()
    ]),
    async ctx => {
      const { Bill } = ctx.db
      try {
        await Bill.create(ctx.request.body)
        ctx.io.update()
        ctx.success()
      } catch (error) {
        ctx.error(500, error.message)
      }
    }
  )
  .post(
    '/bill/update',
    validator([
      ins => ins.body('id').isString().isRequired(),
      ins => ins.body('time').isNumber(),
      ins => ins.body('type').isNumber().isOneOf([0, 1]),
      ins => ins.body('category').isString(),
      ins => ins.body('amount').isNumber()
    ]),
    async ctx => {
      const { Bill } = ctx.db
      const { id, ...restArgs } = ctx.request.body

      try {
        const result = await Bill.findByPk(id)
        if (!result) return ctx.fail('更新失败，数据不存在')

        await Bill.update(restArgs, { where: { id: id }, validate: true })
        ctx.io.update()
        ctx.success()
      } catch (error) {
        ctx.error(500, error.message)
      }
    }
  )
  .post(
    '/bill/delete',
    validator([
      ins => ins.body('id').isString().isRequired()
    ]),
    async ctx => {
      const { Bill } = ctx.db
      const { id } = ctx.request.body
      try {
        Bill.destroy({ where: { id } })
        ctx.io.update()
        ctx.success()
      } catch (error) {
        ctx.error(500, error.message)
      }
    }
  )
  .post(
    '/categories/create',
    validator([
      ins => ins.body('id').isString().isRequired(),
      ins => ins.body('name').isString().isRequired(),
      ins => ins.body('type').isNumber().isOneOf([0, 1]).isRequired(),
    ]),
    async ctx => {
      const { Categories } = ctx.db
      const { id } = ctx.request.body

      try {
        const data = await Categories.findByPk(id)
        if (data) return ctx.fail('创建失败，该分类ID已存在')

        await Categories.create(ctx.request.body)
        ctx.io.update()
        ctx.success()
      } catch (error) {
        ctx.error(500, error.message)
      }
    }
  )

export default cashbook
