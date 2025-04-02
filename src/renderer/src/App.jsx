import { Route, Switch } from 'wouter'
import Login from './components/login'
import Home from './components/registroVentas'
import Ventas from './components/ventas'
import Inventario from './components/inventario'
import NuevoProducto from './creats/nuevoProducto'
import Usuario from './components/usuario'
import Proveedores from './components/proveedores'
import Clientes from './components/clientes'
import Estadisticas from './components/estadisticas'
import Informe from './components/informe'
import FormasPago from './components/formasPago'
import ConfirmacionDatosDeCompra from './components/confirmacionDatosDeCompra'
import CreateUser from './creats/createUser'
import Empleados from './components/empleados'
import CreateProvider from './creats/createProvider'
import CreateClient from './creats/createClient'




function App() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/ventas" component={Ventas} />
      <Route path="/inventario" component={Inventario} />
      <Route path="/nuevoProducto" component={NuevoProducto} />
      <Route path="/usuario" component={Usuario} />
      <Route path="/proveedores" component={Proveedores} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/estadisticas" component={Estadisticas} />
      <Route path="/informe" component={Informe} />
      <Route path="/formaPago" component={FormasPago} />
      <Route path="/confirmacionDatosDeCompra" component={ConfirmacionDatosDeCompra} />
      <Route path="/createUser" component={CreateUser} />
      <Route path="/empleados" component={Empleados} />
      <Route path="/nuevoProveedor" component={CreateProvider} />
      <Route path="/nuevoCliente" component={CreateClient} /> 
    </Switch>
  )
}

export default App
