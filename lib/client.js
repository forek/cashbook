const fetch = require('isomorphic-fetch')
const querystring = require('querystring')
const urltools = require('url')

const defaultHeaders = {
  Connection: 'keep-alive',
  Accept: '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache'
}
class Client {
  constructor (options, headers = {}) {
    this.options = Object.assign({
      credentials: 'include'
    }, options, { headers: Object.assign({}, defaultHeaders, headers) })
  }

  fetch (url) {
    return fetch(url, this.options).then(res => {
      const contentType = res.headers.get('Content-Type')
      console.log(`-------- fetch: ${url} --------`)
      if (this.options.body) console.log('body', JSON.stringify(this.options.body))
      console.log('Content-Type', contentType)
      console.log('status', res.status)
      console.log('statusText', res.statusText)
      const promise = contentType.includes('application/json') ? res.json() : res.text()
      return promise.then(result => {
        console.log('result', result)
        if (parseInt(res.status) >= 400) return Promise.reject(Object.assign({}, res, { fetchResult: result }))
        return Promise.resolve(result)
      })
    })
  }
}

class ClientBuilder {
  constructor (methodlist = []) {
    this._clients = {}
    methodlist.forEach((item) => {
      this._clients[item.method] = new item.CurrentClass()
      this[item.method] = (url, params) => this._clients[item.method].fetch(url, params)
    })
  }
}

class BodyClient extends Client {
  constructor (method) {
    super({ method: method }, { 'content-type': 'application/json' })
  }

  fetch (url, params = {}) {
    this.options.body = JSON.stringify(params)
    return super.fetch(url)
  }
}

class GetClient extends Client {
  constructor () {
    super({ method: 'GET' })
  }

  fetch (url, params = {}) {
    const urlobj = urltools.parse(url)
    urlobj.search = querystring.stringify(params)
    return super.fetch(urltools.format(urlobj))
  }
}

class PostClient extends BodyClient {
  constructor () {
    super('POST')
  }
}

export default new ClientBuilder([
  { method: 'get', CurrentClass: GetClient },
  { method: 'post', CurrentClass: PostClient }
])
