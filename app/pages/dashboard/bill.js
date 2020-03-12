import React from 'react'
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

class Bill extends React.Component {
  render () {
    return (
      <div className='bill'>
        <Upload
          name='categories'
          action='/upload/categories'
        >
          <Button><UploadOutlined />上传账单</Button>
        </Upload>
      </div>
    )
  }
}

export default Bill
