import React from 'react'
import { Upload, Button, Table, Form, Input, DatePicker, Radio, Select, InputNumber, Modal, Empty, Statistic, Row, Col, Card } from 'antd'
import { UploadOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import io from 'socket.io-client'
import moment from 'moment'
import Decimal from 'decimal.js'

import client from '../../../lib/client'
import BillCategoryExpensesTable from './components/bill_category_expenses_table'

const { Option } = Select

const uploadConfig = {
  name: 'csv',
  action: '/api/upload/csv',
  showUploadList: false,
  accept: '.csv'
}

const createColumns = ({
  monthlFilters: mfs,
  categoriesFilters: cfs,
  categoriesDictionary,
  editingKey,
  filtersStatus
}, ctx) => [
  (() => {
    const cfg = {
      title: '账单时间',
      dataIndex: 'time',
      key: 'time',
      filters: mfs,
      filterMultiple: false,
      filteredValue: filtersStatus.time,
      editable: true,
      render: (time, record) => record.formatted_time,
      onFilter: (value, record) => record.formatted_month === value
    }
    if (!mfs.length) delete cfg.filters
    return cfg
  })(),
  {
    title: '账单类型',
    dataIndex: 'type',
    key: 'type',
    editable: true,
    render: type => {
      switch (type) {
        case 0: return '收入'
        case 1: return '支出'
      }
    }
  },
  (() => {
    const cfg = {
      title: '账单分类',
      dataIndex: 'category',
      key: 'category',
      filters: cfs,
      editable: true,
      filteredValue: filtersStatus.category,
      render: category => {
        if (category === 'empty') return '无'
        const currCategory = categoriesDictionary[category]
        if (!currCategory) return '分类数据已丢失'
        return currCategory
      },
      onFilter: (value, record) => record.category === value
    }
    if (!cfs.length) delete cfg.filters
    return cfg
  })(),
  {
    title: '账单金额',
    dataIndex: 'amount',
    key: 'amount',
    editable: true
  },
  {
    title: '操作',
    dataIndex: 'operation',
    render: (_, record) => {
      if (editingKey === record.id) {
        return (
          <span>
            <a className='bill__editor_btn' onClick={ctx.save.bind(null, record)}>保存</a>
            <a className='bill__editor_btn bill__editor_red' onClick={ctx.delete.bind(null, record)}>删除</a>
            <a className='bill__editor_btn' onClick={ctx.cancelEditing}>取消</a>
          </span>
        )
      }
      return (
        <a
          disabled={!!editingKey}
          onClick={ctx.setEditingKey.bind(null, record)}
        >
          编辑
        </a>
      )
    }
  }
]

const createMergedColumns = (state, ctx) => {
  const cols = createColumns(state, ctx)
  return cols.map(col => {
    if (!col.editable) return col
    return {
      ...col,
      onCell: record => ({
        ctx,
        state,
        record,
        inputType: '',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: state.editingKey === record.id
      })
    }
  })
}

const FormElement = ({ ctx, state, ...props }) => {
  switch (props.dataIndex) {
    case 'time': {
      return (
        <Form.Item {...props}>
          <DatePicker />
        </Form.Item>
      )
    }
    case 'type': {
      return (
        <Form.Item {...props}>
          <Radio.Group disabled={state.typeDisabled}>
            <Radio value={0}>收入</Radio>
            <Radio value={1}>支出</Radio>
          </Radio.Group>
        </Form.Item>
      )
    }
    case 'category': {
      return (
        <Form.Item {...props}>
          <Select placeholder='清选择账单类型' onChange={ctx.updateTypeFieldsValue}>
            <Option value='empty' >无</Option>
            {state.categories.map(item => (
              <Option value={item.id} key={item.id}>{item.name}</Option>
            ))}
          </Select>
        </Form.Item>
      )
    }
    case 'amount': {
      return (
        <Form.Item {...props} >
          <InputNumber step={0.01} />
        </Form.Item>
      )
    }
    default: {
      return (
        <Form.Item {...props}>
          <Input />
        </Form.Item>
      )
    }
  }
}

const EditableCell = ({ ctx, editing, dataIndex, title, inputType, record, index, children, state, ...restProps }) => {
  if (!editing) return <td {...restProps}>{children}</td>

  const config = {
    ctx,
    record,
    state,
    dataIndex,
    name: dataIndex,
    style: { margin: 0, minHeight: 60 },
    rules: [
      {
        required: true,
        message: `请输入 ${title}!`
      }
    ]
  }

  return (
    <td {...restProps}>
      <FormElement {...config} />
    </td>
  )
}

let monthlyFinanceCache = {

}

class Bill extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      status: {
        bill_length: '--',
        categories_length: '--'
      },
      bill: [],
      categories: {},
      categoriesFilters: [],
      categoriesDictionary: {},
      monthlFilters: [],
      monthlFiltersDictionary: {},
      editingKey: '',
      ready: false,
      dataUpdateAt: '--',
      filtersStatus: {
        time: null,
        category: null
      },
      currentPage: 1,
      typeDisabled: true,
      currentDataSource: []
    }
  }

  formRef = React.createRef()

  componentDidMount () {
    this.initSocket()
  }

  initSocket () {
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
      }, { result: [], tmp: {} })

      this.setState(Object.assign(data, {
        ready: true,
        categoriesFilters,
        categoriesDictionary,
        monthlFilters: monthlFilters.result,
        monthlFiltersDictionary: monthlFilters.tmp,
        dataUpdateAt: moment().format('YYYY-MM-DD HH:mm:ss')
      }))
    })
  }

  handleTableChange = (pagination, filters, sorter, { currentDataSource }) => {
    this.setState({
      filtersStatus: filters,
      paginationStatus: pagination,
      currentDataSource,
      categoryExpensesData: filters.time ? this.calcCategoryExpensesData(this.state.bill, filters.time[0], this.state.categoriesDictionary) : []
    })
  }

  setEditingKey = record => {
    const value = { ...record }
    value.time = moment(value.time)
    this.formRef.current.setFieldsValue(value)
    this.setState({ editingKey: record.id, typeDisabled: this.isTypeDisabled(record.category) })
  }

  cancelEditing = () => {
    const { editingKey } = this.state
    const nextState = { editingKey: '' }

    if (this.isTmpData(editingKey)) {
      const nextBill = this.removeFromBill(editingKey)
      if (nextBill) nextState.bill = nextBill
    }

    this.setState(nextState)
  }

  delete = record => {
    if (this.isTmpData(record.id)) return this.cancelEditing()
    Modal.confirm({
      title: '警告',
      icon: <ExclamationCircleOutlined />,
      content: '该条目删除后不可恢复，是否确认删除？',
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await client.post('/api/cashbook/bill/delete', {
            id: record.id
          })
          this.cancelEditing()
        } catch (error) {
          console.log(error.message)
        }
      }
    })
  }

  save = async record => {
    this.cancelEditing()
    try {
      const row = await this.formRef.current.validateFields()
      if (this.isTmpData(record.id)) {
        const args = { ...row }
        args.time = args.time.valueOf()

        await client.post('/api/cashbook/bill/create', args)
      } else {
        const diffResult = this.billRecordDiff(row, record)
        if (!diffResult) return

        await client.post('/api/cashbook/bill/update', {
          id: record.id,
          ...diffResult
        })

        console.log('diffResult', diffResult)
      }
    } catch (error) {
      console.log('Validate Failed:', error)
    }
  }

  addBill = () => {
    const { editingKey } = this.state
    if (editingKey) return

    const newObject = this.createNewBillObject()
    const newBill = [...this.state.bill]
    newBill.unshift(newObject)
    this.setState(
      {
        bill: newBill,
        currentPage: 1,
        typeDisabled: this.isTypeDisabled(newObject.category)
      },
      () => this.setEditingKey(newObject)
    )
  }

  handleChangePagination = page => {
    this.setState({ currentPage: page })
  }

  updateTypeFieldsValue = id => {
    if (id !== 'empty') {
      const { categories } = this.state
      const obj = categories.find(item => item.id === id)
      this.formRef.current.setFieldsValue({ type: obj.type })
    }

    this.setState({ typeDisabled: this.isTypeDisabled(id) })
  }

  handleChangeTimeFilter = time => {
    const { filtersStatus, bill, categoriesDictionary } = this.state
    const newFilterStatus = { ...filtersStatus }
    newFilterStatus.time = time && [time.format('YYYY年MM月')]

    const currentDataSource = this.calcCurrentDataSource(bill, newFilterStatus)

    this.setState({
      filtersStatus: newFilterStatus,
      currentDataSource,
      categoryExpensesData: newFilterStatus.time ? this.calcCategoryExpensesData(bill, newFilterStatus.time[0], categoriesDictionary) : []
    })
  }

  calcDisabledTime = time => {
    const { monthlFiltersDictionary } = this.state
    const str = time.format('YYYY年MM月')
    if (monthlFiltersDictionary[str]) return false
    return true
  }

  calcCurrentDataSource (bill, filtersStatus) {
    return bill.filter(item => {
      for (const key in filtersStatus) {
        let currKey = key
        const element = filtersStatus[key]
        if (!element) continue

        if (currKey === 'time') currKey = 'formatted_month'
        if (!element.includes(item[currKey])) return false
      }
      return true
    })
  }

  isTypeDisabled (type) {
    return type !== 'empty'
  }

  removeFromBill (id, obj) {
    const { bill } = this.state
    const index = bill.findIndex(item => item.id === id)

    if (index > -1) {
      const nextBill = [...bill]
      if (obj) {
        nextBill.splice(index, 1, obj)
      } else {
        nextBill.splice(index, 1)
      }
      return nextBill
    } else {
      return null
    }
  }

  billRecordDiff (row, record) {
    const result = {}
    const currRow = { ...row }
    let flag = false
    currRow.time = currRow.time.valueOf();

    ['type', 'time', 'category', 'amount'].forEach(key => {
      if (record[key] !== currRow[key]) {
        result[key] = currRow[key]
        flag = true
      }
    })

    if (flag) return result
    return null
  }

  createTmpId () {
    return `tmp-bill-${Math.random().toString(36).slice(2)}`
  }

  isTmpData (id) {
    return id.indexOf('tmp-bill') === 0
  }

  createNewBillObject () {
    const { filtersStatus } = this.state

    const newObject = {
      id: this.createTmpId(),
      time: Date.now(),
      type: 0,
      category: 'empty',
      amount: 0
    }

    for (const key in filtersStatus) {
      const item = filtersStatus[key]
      if (Array.isArray(item) && item.length) {
        newObject[key] = key === 'time' ? moment(item[0], 'YYYY年MM月').valueOf() : item[0]
      }
    }

    newObject.formatted_month = moment(newObject.time).format('YYYY年MM月')

    return newObject
  }

  calcSummary (dataSource) {
    const data = [new Decimal(0), new Decimal(0)]
    dataSource.forEach(item => {
      data[item.type] = Decimal.add(data[item.type], new Decimal(item.amount))
    })
    return data
  }

  calcCategoryExpensesData (bill, timeFilter, categoriesDictionary = {}) {
    const { result } = bill.reduce((pre, v) => {
      if (v.formatted_month !== timeFilter) return pre
      const { result, tmp } = pre
      if (v.type === 1) {
        if (tmp[v.category]) {
          const currObj = result[tmp[v.category]]
          currObj.amount = Decimal.add(currObj.amount, v.amount)
        } else {
          tmp[v.category] = result.push({
            category: v.category,
            title: categoriesDictionary[v.category],
            amount: new Decimal(v.amount)
          }) - 1
        }
      }
      return pre
    }, { result: [], tmp: {} })

    return result.map(item => {
      item.amount = item.amount.toFixed(2)
      return item
    })
  }

  renderSummary = () => {
    const { filtersStatus, currentDataSource } = this.state
    if (!filtersStatus.time) return false
    const data = this.calcSummary(currentDataSource)
    return (
      <>
        <tr className='bill__summary'>
          <th colSpan={5}>{filtersStatus.time[0]} 数据统计：</th>
        </tr>
        <tr className='bill__summary'>
          <th>收入</th>
          <td colSpan={1}>
            <span className='bill__summary-text'>{data[0].toFixed(2)}</span>
          </td>
          <th>支出</th>
          <td colSpan={2}>
            <span className='bill__summary-text'>{data[1].toFixed(2)}</span>
          </td>
        </tr>
      </>
    )
  }

  renderBillTable () {
    const { bill, ready, currentPage } = this.state
    if (!ready) return false

    return <Form ref={this.formRef}>
      <Table
        components={{
          body: {
            cell: EditableCell
          }
        }}
        locale={{
          filterConfirm: '确定',
          filterReset: '重置',
          emptyText: <Empty description={false} />
        }}
        rowClassName='bill__editable-row'
        dataSource={bill}
        columns={createMergedColumns(this.state, this)}
        onChange={this.handleTableChange}
        pagination={{
          current: currentPage,
          onChange: this.handleChangePagination,
          style: { marginRight: 16 }
        }}
        summary={this.renderSummary}
      />
    </Form>
  }

  renderDesc () {
    let { status, dataUpdateAt } = this.state
    return (
      <Row gutter={16}>
        <Col span={8}>
          <Card><Statistic title='账单数据总数' value={status.bill_length} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title='账单分类类型总数' value={status.categories_length} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title='本地数据最近更新时间' value={dataUpdateAt} /></Card>
        </Col>
      </Row>
    )
  }

  renderDatePicker () {
    let { time } = this.state.filtersStatus
    if (time) time = moment(time, 'YYYY年MM月')
    return (
      <DatePicker
        onChange={this.handleChangeTimeFilter}
        picker='month'
        value={time}
        format='YYYY年MM月'
        disabledDate={this.calcDisabledTime}
        placeholder='全部月份'
      />
    )
  }

  renderoOperation () {
    return (
      <Row gutter={16}>
        <Col span={24}>
          <Card>
            <span>选择月份：</span>
            {this.renderDatePicker()}
            <Button
              type='primary'
              className='bill__op-btn'
              onClick={this.addBill}
            >
              <PlusOutlined />
              新建账单数据
            </Button>

            <Upload
              {...uploadConfig}
              data={{ type: 'bill' }}
              className='bill__op-btn bill__op-btn--float'
            >
              <Button><UploadOutlined />导入账单表</Button>
            </Upload>

            <Upload
              {...uploadConfig}
              data={{ type: 'categories' }}
              className='bill__op-btn bill__op-btn--float'
            >
              <Button><UploadOutlined />导入类型表</Button>
            </Upload>
          </Card>
        </Col>
      </Row>
    )
  }

  renderBillCategoryExpensesTable () {
    const { time } = this.state.filtersStatus
    if (!time) return
    return (
      <>
        <h3> {time[0]} 分类支出金额统计</h3>
        <BillCategoryExpensesTable dataSource={this.state.categoryExpensesData} />
      </>
    )
  }

  render () {
    return (
      <div className='bill'>
        {this.renderDesc()}
        <br />
        {this.renderoOperation()}
        <br />
        <div className='bill__table'>
          {this.renderBillTable()}
        </div>
        <div className='bill__table'>

          {this.renderBillCategoryExpensesTable()}
        </div>
      </div>
    )
  }
}

export default Bill
