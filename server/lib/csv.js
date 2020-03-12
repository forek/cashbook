import csvParse from 'csv-parse'

export function parse (str, options = {}) {
  return new Promise((resolve, reject) => {
    csvParse(str, options, (err, records) => {
      if (err) return reject(err)
      resolve(records)
    })
  })
}
