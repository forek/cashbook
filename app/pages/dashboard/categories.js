import React from 'react'
import { Button, Modal, Form, Input, Radio, Table, message } from 'antd'
import socket from '../../utils/socket'
import client from '../../../lib/client'
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
      categories: [],
      modelFormVisible: false
    }
  }

  formRef = React.createRef()

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

  unvisible = () => {
    this.formRef.current.resetFields()
    this.setState({ modelFormVisible: false })
  }

  create = () => {
    this.setState({ modelFormVisible: true })
  }

  createCategory = async () => {
    try {
      const data = await this.formRef.current.validateFields()
      this.unvisible()
      const { success, result } = await client.post('/api/cashbook/categories/create', data)
      if (success) {
        message.success('创建成功')
      } else {
        message.error(result)
      }
    } catch (error) {
      message.error('创建失败')
    }
  }

  renderModelForm () {
    const { modelFormVisible } = this.state
    return (
      <Modal
        visible={modelFormVisible}
        title='创建分类'
        okText='创建'
        cancelText='取消'
        onCancel={this.unvisible}
        onOk={this.createCategory}
      >
        <Form
          ref={this.formRef}
          layout='vertical'
          initialValues={{
            id: '',
            name: '',
            type: 0
          }}
        >
          <Form.Item
            name='id'
            label='分类ID'
            rules={[
              { required: true, message: '请输入分类ID' }
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item
            name='name'
            label='分类名称'
            rules={[
              { required: true, message: '请输入分类名称' }
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name='type' label='分类收支类型'>
            <Radio.Group>
              <Radio value={0}>收入</Radio>
              <Radio value={1}>支出</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    )
  }

  render () {
    const { categories } = this.state
    return (
      <div className='categories'>
        <h3>
          <span>账单分类：</span>
          <Button
            className='categories__create-btn'
            type='primary'
            value='创建分类'
            onClick={this.create}
          >
            创建账单分类
          </Button>
        </h3>
        <Table
          columns={columns}
          dataSource={categories}
          pagination={{
            hideOnSinglePage: true,
            style: { marginRight: 16 }
          }}
        />
        {this.renderModelForm()}
      </div>
    )
  }
}

export default Categories
