import { Route, Router } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { SessionProvider } from './contexts/SessionContext'
import { useGlobalData } from './contexts/GlobalDataContext'
import ProtectedRoute from './components/ProtectedRoute'
import PreloadScreen from './components/PreloadScreen'
import { useState } from 'react'
import Clientes from './components/Clientes'
import ConfirmacionDatosDeCompra from './components/ConfirmacionDatosDeCompra'
import Empleados from './components/Empleados'
import FormasPago from './components/FormasPago'
import InfoClientes from './components/infoCliente'
import InfoProvider from './components/Proveedores/infoProvider'
import Informe from './components/informe'
import Inventario from './components/inventory/inventario'
import Login from './components/login'
import Proveedores from './components/Proveedores/proveedores'
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
import ComprehensiveStatistics from './components/stadistics/comprehensive-statistics'
import MoveInventory from './components/Inventory/moveInventory'
import TestColorPage from './test/TestColorPage'
import TestDaisyUI from './test/TestDaisyUI'
import StyleTest from './components/StyleTest'
import ResumenProveedores from './components/stadistics/resumenProveedores'
import EditarProducto from './components/Inventory/editarProducto'
import GestionFormaDePago from './componentes especificos/GestionFormaDePago'
import AgregarCompraProveedor from './components/Proveedores/agregarCompraProveedor'
import AgregarProductoCompraProveedor from './components/Proveedores/agregarProductoCompraProveedor'
import PedidosAProveedores from './components/Proveedores/pedidosAProveedores'
import { ProductProvider } from './contexts/ProductContext'

function App() {
  const { isLoading } = useGlobalData()
  const [preloadComplete, setPreloadComplete] = useState(false)

  // Mostrar pantalla de precarga mientras se cargan datos globales
  if (isLoading && !preloadComplete) {
    return <PreloadScreen onComplete={() => setPreloadComplete(true)} />
  }
  return (
    <SessionProvider>
      <Router hook={useHashLocation}>
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
        <Route path="/test-daisy">
          <ProtectedRoute>
            <TestDaisyUI />
          </ProtectedRoute>
        </Route>
        <Route path="/style-test">
          <ProtectedRoute>
            <StyleTest />
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
            <ComprehensiveStatistics />
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
        <Route path="/editarProducto">
          <ProtectedRoute>
            <EditarProducto />
          </ProtectedRoute>
        </Route>
        <Route path="/formasDePagoGestion">
          <ProtectedRoute>
            <GestionFormaDePago />
          </ProtectedRoute>
        </Route>
        <Route path="/agregandoCompraProveedor">
          <ProtectedRoute>
            <ProductProvider>
              <AgregarCompraProveedor />
            </ProductProvider>
          </ProtectedRoute>
        </Route>
        <Route path="/agregarProductoCompraProveedor">
          <ProtectedRoute>
            <ProductProvider>
              <AgregarProductoCompraProveedor />
            </ProductProvider>
          </ProtectedRoute>
        </Route>
        <Route path="/pedidosProveedor">
          <ProtectedRoute>
            <PedidosAProveedores />
          </ProtectedRoute>
        </Route>
      </Router>
    </SessionProvider>
  )
}

export default App
