import moment from 'moment'

class SocketManager {
  constructor ({ io, db }) {
    this.io = io
    this.db = db
    io.on('connection', async socket => {
      socket.on('bill', async () => {
        socket.emit('bill', await this.getCashbookData())
      })
    })
  }

  async getCashbookData () {
    const { Cashbook } = this.db
    const [status, bill, categories] = await Promise.all([
      Cashbook.status(),
      this.getBill(),
      this.getCategoriesObject()
    ])
    return { status, bill, categories }
  }

  async update () {
    this.io.emit('bill', await this.getCashbookData())
  }

  async getBill () {
    const { Bill } = this.db
    const bill = await Bill.findAll()
    return bill.map(({ id, type, time, category, amount }) => {
      const formattedTime = moment(time).format('YYYY年MM月DD日')

      return {
        id,
        time,
        type,
        category,
        amount,
        formatted_month: formattedTime.slice(0, 8),
        formatted_time: formattedTime
      }
    })
  }

  async getCategoriesObject () {
    const { Categories } = this.db
    const c = await Categories.findAll()
    const result = c.map(({ id, name, type }) => ({ id, name, type }))
    result.push({ id: 'empty', name: '其他分类', type: null })
    return result
  }
}

export default SocketManager
