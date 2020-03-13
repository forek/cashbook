import moment from 'moment'

class SocketManager {
  constructor ({ io, db }) {
    this.io = io
    this.db = db
    io.on('connection', socket => {
      this.init(socket)
      // const cookies = cookie.parse(socket.request.headers.cookie)
      // const session = this.store.get(cookies['koa:sess'])
      // socket.emit('init', this.state.getStateInfo())
      // if (this.state.emitedImage && session.id === this.state.createBy) {
      //   socket.emit('login image', this.state.emitedImage)
      // }
    })
  }

  async init (socket) {
    const { Cashbook } = this.db
    const payload = {
      status: await Cashbook.status(),
      bill: await this.getBill(),
      categories: await this.getCategoriesObject()
    }
    socket.emit('bill', payload)
  }

  async update () {
    const { Cashbook } = this.db
    const payload = {
      status: await Cashbook.status(),
      bill: await this.getBill(),
      categories: await this.getCategoriesObject()
    }

    this.io.emit('bill', payload)
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
    const result = {}
    c.forEach(({ id, name, type }) => {
      result[id] = { name, type }
    })
    return c.map(({ id, name, type }) => ({ id, name, type }))
  }
}

export default SocketManager
