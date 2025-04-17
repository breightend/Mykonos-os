import { Route, Switch } from 'wouter'
import Clientes from './components/clientes'
import ConfirmacionDatosDeCompra from './components/confirmacionDatosDeCompra'
import Empleados from './components/empleados'
import Estadisticas from './components/estadisticas'
import FormasPago from './components/formasPago'
import InfoClientes from './components/infoCliente'
import InfoProvider from './components/infoProvider'
import Informe from './components/informe'
import Inventario from './components/inventario'
import Login from './components/login'
import Proveedores from './components/proveedores'
import Home from './components/registroVentas'
import Usuario from './components/usuario'
import Ventas from './components/ventas'
import CreateClient from './creats/createClient'
import CreateProvider from './creats/createProvider'
import CreateUser from './creats/createUser'
import NuevoProducto from './creats/nuevoProducto'
import InfoEmpleado from './components/infoEmpleado'

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
      <Route path="/infoEmpleado" component={InfoEmpleado} />
      <Route path="/nuevoProveedor" component={CreateProvider} />
      <Route path="/nuevoCliente" component={CreateClient} />
      <Route path="/infoCliente" component={InfoClientes} />
      <Route path="/infoProvider" component={InfoProvider} />
    </Switch>
  )
}

export default App
