import React from 'react'
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const uploadConfig = {
  name: 'csv',
  action: '/api/upload/csv',
  showUploadList: false,
  accept: '.csv'
}

class Bill extends React.Component {
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
      </div>
    )
  }
}

export default Bill
