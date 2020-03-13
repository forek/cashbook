import React from 'react'
import { Upload, Button, Table, Form, Input, DatePicker, Radio, Select, InputNumber } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import io from 'socket.io-client'
import moment from 'moment'

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
        const currCategory = categoriesDictionary[category]
        if (!currCategory) return '无'
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
            <a
              href='javascript: void 0;'
              onClick={ctx.save.bind(null, record.id)}
            >
              保存
            </a>
            <span> | </span>
            <a
              href='javascript: void 0;'
              onClick={ctx.cancelEditing}
            >
              取消
            </a>
          </span>
        )
      }
      return (
        <a
          disabled={!!editingKey}
          href='javascript: void 0;'
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

const FormElement = (props) => {
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
          <Radio.Group>
            <Radio value={0}>收入</Radio>
            <Radio value={1}>支出</Radio>
          </Radio.Group>
        </Form.Item>
      )
    }
    case 'category': {
      return (
        <Form.Item {...props}>
          <Select placeholder='清选择账单类型'>
            {props.state.categories.map(item => (
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

const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, state, ...restProps }) => {
  if (!editing) return <td {...restProps}>{children}</td>

  const config = {
    record,
    state,
    dataIndex,
    name: dataIndex,
    style: { margin: 0 },
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
      status: {},
      bill: [],
      categories: {},
      categoriesFilters: [],
      categoriesDictionary: {},
      monthlFilters: [],
      editingKey: '',
      ready: false
    }

    this.setEditingKey = this.setEditingKey.bind(this)
    this.cancelEditing = this.cancelEditing.bind(this)
    this.save = this.save.bind(this)
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
        monthlFilters
      }))
    })
  }

  handleTableChange (pagination, filters, sorter, { currentDataSource }) {
    console.log(pagination, filters, sorter, currentDataSource)
  }

  setEditingKey (record) {
    const value = { ...record }
    value.time = moment(value.time)
    this.formRef.current.setFieldsValue(value)
    this.setState({ editingKey: record.id })
  }

  cancelEditing () {
    this.setState({ editingKey: '' })
  }

  async save (id) {
    try {
      const { bill } = this.state
      const row = await this.formRef.current.validateFields()
      const newData = [...bill]
      const index = newData.findIndex(item => id === item.id)

      console.log(row, newData[index])
      this.cancelEditing()
    } catch (error) {
      console.log('Validate Failed:', error)
    }
  }

  renderBillTable () {
    const { bill, ready } = this.state
    if (!ready) return false

    return <Form ref={this.formRef}>
      <Table
        components={{
          body: {
            cell: EditableCell
          }
        }}
        rowClassName='bill__editable-row'
        dataSource={bill}
        columns={createMergedColumns(this.state, this)}
        onChange={this.handleTableChange}
      />
    </Form>
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
