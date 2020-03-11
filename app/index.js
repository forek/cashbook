import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { NotFound } from './status'

function Home () {
  return (
    <div>Hello World</div>
  )
}

function App () {
  return (
    <Switch>
      <Route path='/about' component={Home} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default App
