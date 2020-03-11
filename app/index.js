import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
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
      <Route path='/' exact render={() => <Redirect to='/dashboard' />} />
      <Route path='/dashboard' component={Dashboard} />
      <Route path='/about' component={Home} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default App
