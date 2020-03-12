import Sequelize from 'sequelize'

export const define = instance => instance.define('categories', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  type: Sequelize.INTEGER,
  name: Sequelize.STRING
})

export const csvHeader = 'id,type,name'
