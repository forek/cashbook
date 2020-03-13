import React from 'react'
import { Upload, Button, Table } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import client from '../../../lib/client'
import io from 'socket.io-client'

const uploadConfig = {
  name: 'csv',
  action: '/api/upload/csv',
  showUploadList: false,
  accept: '.csv'
}

class Bill extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      status: {},
      bill: [],
      categories: {},
      categoriesFilters: [],
      categoriesDictionary: {},
      monthlFilters: [],
      ready: false
    }
  }

  componentDidMount () {
    const socket = io('/cashbook')
    socket.on('bill', (data) => {
      const { categories, bill } = data
      const categoriesDictionary = {}
      const categoriesFilters = categories.map(item => {
        categoriesDictionary[item.id] = item.name
        return { value: item.id, text: item.name }
      })

      const monthlFilters = bill.reduce((pre, v) => {
        const { result, tmp } = pre
        if (!tmp[v.formatted_month]) {
          tmp[v.formatted_month] = true
          result.push({ text: v.formatted_month, value: v.formatted_month })
        }
        return pre
      }, { result: [], tmp: {} }).result

      this.setState(Object.assign(data, {
        ready: true,
        categoriesFilters,
        categoriesDictionary,
        monthlFilters
      }))
    })
  }

  getFilters () {
    const { categories } = this.state
    const result = []
    for (const key in categories) {
      result.push({ value: key, text: categories[key].name })
    }

    return result
  }

  getColumns () {
    const col = [
      {
        title: '账单时间',
        dataIndex: 'time',
        key: 'time',
        filters: this.state.monthlFilters,
        render: (time, record) => record.formatted_time,
        onFilter: (value, record) => record.formatted_month === value
      },
      {
        title: '账单类型',
        dataIndex: 'type',
        key: 'type',
        render: type => {
          switch (type) {
            case 0: return '收入'
            case 1: return '支出'
          }
        }
      },
      {
        title: '账单分类',
        dataIndex: 'category',
        key: 'category',
        filters: this.state.categoriesFilters,
        render: category => {
          const currCategory = this.state.categoriesDictionary[category]
          if (!currCategory) return '无'
          return currCategory
        },
        onFilter: (value, record) => record.category === value
      },
      {
        title: '账单金额',
        dataIndex: 'amount',
        key: 'amount'
      }
    ]

    return col
  }

  handleTableChange (pagination, filters, sorter, { currentDataSource }) {
    console.log(pagination, filters, sorter, currentDataSource)
  }

  renderBillTable () {
    const { bill, ready } = this.state
    if (!ready) return false

    return <Table
      dataSource={bill}
      columns={this.getColumns()}
      onChange={this.handleTableChange}
    />
  }

  render () {
    return (
      <div className='bill'>
        <Upload
          {...uploadConfig}
          data={{ type: 'bill' }}
        >
          <Button><UploadOutlined />导入账单表</Button>
        </Upload>
        <Upload
          {...uploadConfig}
          data={{ type: 'categories' }}
        >
          <Button><UploadOutlined />导入类型表</Button>
        </Upload>
        {this.renderBillTable()}
      </div>
    )
  }
}

export default Bill
