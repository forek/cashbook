import path from 'path'
import Sequelize from 'sequelize'

import * as categories from './model/categories'
import * as bill from './model/bill'

import * as cashbook from './virtual_model/cashbook'

const model = [
  { name: 'Categories', curr: categories },
  { name: 'Bill', curr: bill }
]

const virtualModel = [
  { name: 'Cashbook', curr: cashbook }
]

class DataBaseManger {
  constructor () {
    this.instance = new Sequelize({
      database: 'cashbook',
      username: 'adim',
      password: null,
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../.sqlite/cashbook.db')
    })

    this.model = model.map(item => {
      const { curr } = item
      const Model = this[item.name] = curr.define(this.instance, this)
      Object.keys(curr).forEach(key => {
        if (key === 'define') return
        if (Model[key]) throw new Error(`Model属性已存在, 请勿覆盖: ${key}.`)
      })
      Object.assign(Model, curr, { define: undefined })
      return Model
    })

    this.virtualModel = virtualModel.map(item => {
      const VirtualModel = this[item.name] = item.curr
      VirtualModel.ctx = this
      return VirtualModel
    })
  }

  async init () {
    try {
      await this.instance.authenticate()
      await Promise.all(this.model.map(m => m.sync({ alter: true })))
      console.log('Connection has been established successfully.')
      return true
    } catch (error) {
      console.error('Unable to init the database:', error)
      return false
    }
  }
}

export default DataBaseManger
