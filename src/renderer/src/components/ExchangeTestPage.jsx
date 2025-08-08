import CambioProductoModal from '../modals/VentasModal/cambioModal'
import { getCurrentBranchId, setCurrentBranchId } from '../utils/posUtils'
import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'

export default function ExchangeTestPage() {
  const [currentBranch, setCurrentBranch] = useState(getCurrentBranchId())

  useEffect(() => {
    toast.success(`Sucursal actual: ${currentBranch}`, { duration: 3000 })
  }, [currentBranch])

  const handleBranchChange = (branchId) => {
    setCurrentBranchId(branchId)
    setCurrentBranch(branchId)
    toast.success(`Sucursal cambiada a: ${branchId}`)
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Sistema de Intercambio de Productos</h1>

      {/* Branch Selection */}
      <div className="card bg-base-200 mb-8 p-6">
        <h2 className="mb-4 text-xl font-semibold">Configuración de Sucursal</h2>
        <div className="flex items-center space-x-4">
          <span>Sucursal actual:</span>
          <select
            className="select select-bordered"
            value={currentBranch}
            onChange={(e) => handleBranchChange(parseInt(e.target.value))}
          >
            <option value={1}>Local comercial (ID: 1)</option>
            <option value={2}>Depósito central (ID: 2)</option>
          </select>
          <div className="badge badge-primary">ID: {currentBranch}</div>
        </div>
      </div>

      {/* Exchange Demo */}
      <div className="card bg-base-100 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-semibold">Demo de Intercambio</h2>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-primary text-lg font-semibold">Cómo usar:</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <li>Haga clic en el botón "Cambio de Producto"</li>
              <li>
                <strong>Paso 1:</strong> Ingrese el código de barras del producto a devolver
              </li>
              <li>
                <strong>Paso 2:</strong> (Opcional) Ingrese el código de barras del producto nuevo
              </li>
              <li>
                <strong>Paso 3:</strong> Confirme la transacción
              </li>
            </ol>

            <div className="divider"></div>

            <h3 className="text-secondary text-lg font-semibold">Códigos de prueba:</h3>
            <div className="space-y-2 text-sm">
              <div className="bg-base-200 rounded p-2">
                <strong>VAR0003002003</strong> - Test Product Update (S, Rojo)
                <br />
                <span className="text-xs opacity-70">Stock: 12 unidades, Precio: $150.75</span>
              </div>
              <div className="bg-base-200 rounded p-2">
                <strong>VAR0003003004</strong> - Test Product Update (M, Verde)
                <br />
                <span className="text-xs opacity-70">Stock: 9 unidades, Precio: $150.75</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-accent text-lg font-semibold">Características:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="badge badge-success badge-sm">✓</div>
                <span>Validación de productos en tiempo real</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="badge badge-success badge-sm">✓</div>
                <span>Control de stock automático</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="badge badge-success badge-sm">✓</div>
                <span>Cálculo automático de diferencias de precio</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="badge badge-success badge-sm">✓</div>
                <span>Actualización de inventario en tiempo real</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="badge badge-success badge-sm">✓</div>
                <span>Registro de movimientos financieros</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="badge badge-success badge-sm">✓</div>
                <span>Interfaz paso a paso intuitiva</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Exchange Button */}
        <div className="text-center">
          <CambioProductoModal />
        </div>

        {/* Status Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="stat bg-primary text-primary-content rounded-lg">
            <div className="stat-title text-primary-content opacity-80">Devoluciones</div>
            <div className="stat-value">+Stock</div>
            <div className="stat-desc text-primary-content opacity-70">
              El producto devuelto aumenta el inventario
            </div>
          </div>

          <div className="stat bg-secondary text-secondary-content rounded-lg">
            <div className="stat-title text-secondary-content opacity-80">Intercambios</div>
            <div className="stat-value">±Stock</div>
            <div className="stat-desc text-secondary-content opacity-70">
              Ajuste automático del inventario
            </div>
          </div>

          <div className="stat bg-accent text-accent-content rounded-lg">
            <div className="stat-title text-accent-content opacity-80">Diferencias</div>
            <div className="stat-value">±Precio</div>
            <div className="stat-desc text-accent-content opacity-70">
              Cliente paga o recibe crédito
            </div>
          </div>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  )
}
