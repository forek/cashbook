import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { NotFound } from './status'
import Dashboard from './pages/dashboard/index'

function Home () {
  return (
    <div>Hello Home</div>
  )
}

function App () {
  return (
    <Switch>
      <Route path='/' exact component={Dashboard} />
      <Route path='/about' component={Home} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default App
