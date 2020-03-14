import React from 'react'
import { Table } from 'antd'

const columns = [
  {
    title: '支出类型',
    dataIndex: 'category',
    render: (_, record) => record.title
  },
  {
    title: '支出金额',
    dataIndex: 'amount',
    sorter: (a, b) => a.amount - b.amount
  }
]

const BillCategoryExpensesTable = ({ dataSource }) => {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={{ hideOnSinglePage: true }}
    />
  )
}

export default BillCategoryExpensesTable
