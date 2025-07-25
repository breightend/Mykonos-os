import { Route, Switch } from 'wouter'
import { SessionProvider } from './contexts/SessionContext'
import ProtectedRoute from './components/ProtectedRoute'
import Clientes from './components/clientes'
import ConfirmacionDatosDeCompra from './components/confirmacionDatosDeCompra'
import Empleados from './components/empleados'
import FormasPago from './components/formasPago'
import InfoClientes from './components/infoCliente'
import InfoProvider from './components/infoProvider'
import Informe from './components/informe'
import Inventario from './components/inventory/inventario'
import Login from './components/login'
import Proveedores from './components/proveedores'
import Home from './components/registroVentas'
import Usuario from './components/usuario'
import Ventas from './components/ventas'
import CreateClient from './creats/createClient'
import CreateProvider from './creats/createProvider'
import NuevoProducto from './creats/nuevoProducto'
import InfoEmpleado from './components/infoEmpleado'
import Sucursales from './components/sucursales'
import NuevaSucursal from './creats/nuevaSucursal'
import InfoSucursal from './components/infoSucursal'
import CreateUser from './creats/createUser'
import InfoProducto from './components/inventory/infoInventory'
import Estadisticas from './components/stadistics/estadisticas'
import MoveInventory from './components/Inventory/moveInventory'
import TestColorPage from './test/TestColorPage'
import ResumenProveedores from './components/stadistics/resumenProveedores'

function App() {
  return (
    <SessionProvider>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/home">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/ventas">
          <ProtectedRoute>
            <Ventas />
          </ProtectedRoute>
        </Route>
        <Route path="/inventario">
          <ProtectedRoute>
            <Inventario />
          </ProtectedRoute>
        </Route>
        <Route path="/infoInventory">
          <ProtectedRoute>
            <InfoProducto />
          </ProtectedRoute>
        </Route>
        <Route path="/nuevoProducto">
          <ProtectedRoute>
            <NuevoProducto />
          </ProtectedRoute>
        </Route>
        <Route path="/test-colors">
          <ProtectedRoute>
            <TestColorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/usuario">
          <ProtectedRoute>
            <Usuario />
          </ProtectedRoute>
        </Route>
        <Route path="/proveedores">
          <ProtectedRoute>
            <Proveedores />
          </ProtectedRoute>
        </Route>
        <Route path="/clientes">
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        </Route>
        <Route path="/informes">
          <ProtectedRoute>
            <Informe />
          </ProtectedRoute>
        </Route>
        <Route path="/formaPago">
          <ProtectedRoute>
            <FormasPago />
          </ProtectedRoute>
        </Route>
        <Route path="/confirmacionDatosDeCompra">
          <ProtectedRoute>
            <ConfirmacionDatosDeCompra />
          </ProtectedRoute>
        </Route>
        <Route path="/createUser">
          <ProtectedRoute>
            <CreateUser />
          </ProtectedRoute>
        </Route>
        <Route path="/empleados">
          <ProtectedRoute>
            <Empleados />
          </ProtectedRoute>
        </Route>
        <Route path="/infoEmpleado">
          <ProtectedRoute>
            <InfoEmpleado />
          </ProtectedRoute>
        </Route>
        <Route path="/nuevoProveedor">
          <ProtectedRoute>
            <CreateProvider />
          </ProtectedRoute>
        </Route>
        <Route path="/nuevoCliente">
          <ProtectedRoute>
            <CreateClient />
          </ProtectedRoute>
        </Route>
        <Route path="/infoCliente">
          <ProtectedRoute>
            <InfoClientes />
          </ProtectedRoute>
        </Route>
        <Route path="/infoProvider">
          <ProtectedRoute>
            <InfoProvider />
          </ProtectedRoute>
        </Route>
        <Route path="/sucursales">
          <ProtectedRoute>
            <Sucursales />
          </ProtectedRoute>
        </Route>
        <Route path="/nuevaSucursal">
          <ProtectedRoute>
            <NuevaSucursal />
          </ProtectedRoute>
        </Route>
        <Route path="/infoSucursal">
          <ProtectedRoute>
            <InfoSucursal />
          </ProtectedRoute>
        </Route>
        <Route path="/estadisticas">
          <ProtectedRoute>
            <Estadisticas />
          </ProtectedRoute>
        </Route>
        <Route path="/moveInventory">
          <ProtectedRoute>
            <MoveInventory />
          </ProtectedRoute>
        </Route>
        <Route path="/resumenProveedores">
          <ProtectedRoute>
            <ResumenProveedores />
          </ProtectedRoute>
        </Route>
      </Switch>
    </SessionProvider>
  )
}

export default App
