class Socket {
  constructor () {
    this._socket = null
    this._cache = null
  }

  getSocket () {
    if (!this._socket) {
      const io = require('socket.io-client')
      this._socket = io('/cashbook')
      this._socket.on('bill', data => {
        this._cache = data
        this._cache.cacheUpdateAt = Date.now()
      })
    }

    return this._socket
  }

  getCache () {
    return this._cache
  }
}

export default new Socket()
