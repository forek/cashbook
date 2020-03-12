class Validator {
  constructor () {
    this.init();

    ['body', 'query'].forEach(item => {
      this[item] = (target) => {
        this.targetType = item
        this.target = target
        return this
      }
    });

    ['number', 'string', 'boolean'].forEach(str => {
      this[`_is${this._toFirstUpperCase(str)}`] = (v) => {
        return typeof v === str
      }
    });

    ['number', 'string', 'boolean', 'object', 'array', 'oneOf'].forEach(str => {
      const key = `is${this._toFirstUpperCase(str)}`
      this[key] = (...args) => {
        this.validator.push({ type: key, args })
        return this
      }
    })
  }

  init () {
    this.targetType = null
    this.target = null
    this.required = false
    this.validator = []
  }

  clean () {
    this.init()
  }

  _toFirstUpperCase (str) {
    return str.replace(str[0], str[0].toUpperCase())
  }

  _isObject (v) {
    return !!v && typeof v === 'object'
  }

  _isArray (v) {
    return Array.isArray(v)
  }

  _isOneOf (v, [arr]) {
    return arr.includes(v)
  }

  isRequired () {
    this.required = true
    return this
  }

  run (ctx) {
    let currObj = ctx.request[this.targetType]
    const value = currObj[this.target]

    if (typeof value === 'undefined' || value === null || value === '') return !this.required

    for (let i = 0; i < this.validator.length; i++) {
      const validate = this.validator[i]
      if (!this[`_${validate.type}`](value, validate.args)) return false
    }

    return true
  }
}

export default Validator
