import React from 'react'
import { Upload, Button, Table, Form, Input, DatePicker, Radio, Select, InputNumber, Modal, Descriptions, Empty } from 'antd'
import { UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import io from 'socket.io-client'
import moment from 'moment'
import client from '../../../lib/client'

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
  editingKey
}, ctx) => [
  (() => {
    const cfg = {
      title: '账单时间',
      dataIndex: 'time',
      key: 'time',
      filters: mfs,
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
      editingKey: '',
      ready: false,
      dataUpdateAt: '--',
      filtersStatus: {
        time: null,
        category: null
      },
      currentPage: 1,
      typeDisabled: true
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
      }, { result: [], tmp: {} }).result

      this.setState(Object.assign(data, {
        ready: true,
        categoriesFilters,
        categoriesDictionary,
        monthlFilters,
        dataUpdateAt: moment().format('YYYY-MM-DD HH:mm:ss')
      }))
    })
  }

  handleTableChange = (pagination, filters, sorter, { currentDataSource }) => {
    this.setState({ filtersStatus: filters, paginationStatus: pagination })
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
          onChange: this.handleChangePagination
        }}
      />
    </Form>
  }

  renderDesc () {
    let { status, dataUpdateAt } = this.state

    return (
      <Descriptions title='账单状态总览'>
        <Descriptions.Item label='账单条目总数'>{status.bill_length}</Descriptions.Item>
        <Descriptions.Item label='账单分类总数'>{status.categories_length}</Descriptions.Item>
        <Descriptions.Item label='本地数据更新时间'>{dataUpdateAt}</Descriptions.Item>
      </Descriptions>
    )
  }

  render () {
    return (
      <div className='bill'>
        {this.renderDesc()}
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
        <Button onClick={this.addBill}><UploadOutlined />新建账单数据</Button>
        {this.renderBillTable()}
      </div>
    )
  }
}

export default Bill
