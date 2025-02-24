import { Route, Switch } from 'wouter'
import Login from './components/login'
import Home from './components/home'
import Ventas from './components/ventas'
import Inventario from './components/inventario'
import NuevoProducto from './components/nuevoProducto'


function App() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/ventas" component={Ventas} />
      <Route path='/inventario' component={Inventario} />
      <Route path='/nuevoProducto' component={NuevoProducto}/>
    </Switch>
  )
}

export default App
