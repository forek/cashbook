import React from 'react'
import ReactMarkdown from 'react-markdown'
import thinkingMd from './markdown/thinking.md'
import './stylesheets/thinking'

class Thinking extends React.Component {
  render () {
    return (
      <div className='thinking'>
        <ReactMarkdown source={thinkingMd} />
      </div>
    )
  }
}

export default Thinking
