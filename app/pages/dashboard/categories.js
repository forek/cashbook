import React from 'react'
import { Table } from 'antd'
import socket from '../../utils/socket'
import './stylesheets/categories.less'

const columns = [
  {
    title: '分类ID',
    dataIndex: 'id'
  },
  {
    title: '分类名称',
    dataIndex: 'name'
  },
  {
    title: '分类收支类型',
    dataIndex: 'type',
    render: type => {
      switch (type) {
        case 0: return '收入'
        case 1: return '支出'
      }
    }
  }
]

class Categories extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      status: {
        bill_length: '--',
        categories_length: '--'
      },
      bill: [],
      categories: []
    }
  }

  componentDidMount () {
    this.socket = socket.getSocket()
    this.socket.on('bill', this.billEventHandler)
    const cache = socket.getCache()
    if (cache) {
      this.billEventHandler(cache)
    } else {
      this.socket.emit('bill')
    }
  }

  componentWillUnmount () {
    this.socket.removeListener('bill', this.billEventHandler)
  }

  billEventHandler = (data) => {
    this.setState(data)
  }

  render () {
    const { categories } = this.state
    return (
      <div className='categories'>
        <h3>账单分类：</h3>
        <Table
          columns={columns}
          dataSource={categories}
          pagination={{
            hideOnSinglePage: true,
            style: { marginRight: 16 }
          }}
        />
      </div>
    )
  }
}

export default Categories
