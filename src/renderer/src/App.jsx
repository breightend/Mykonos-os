import { Route, Switch } from 'wouter'
import Login from './components/login'
import Home from './components/home'
import Ventas from './components/ventas'

function App() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/ventas" component={Ventas} />
    </Switch>
  )
}

export default App
