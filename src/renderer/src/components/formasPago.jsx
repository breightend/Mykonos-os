import { ArrowLeft, CreditCard, HandCoins, Landmark, WalletCards } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState } from 'react'
import CuentaCorrienteClientesFP from '../componentes especificos/CuentaCorrienteClientesFP'
import { useSellContext } from '../contexts/sellContext'

export default function FormasPago() {
  const [, setLocation] = useLocation()
  const [metodosSeleccionados, setMetodosSeleccionados] = useState([])
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState(null)
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [total, setTotal] = useState(0)
  const [descuento, setDescuento] = useState(0)
  const [cantidadAbonar, setCantidadAbonar] = useState(0)
  const [monstrarDetalle, setMostrarDetalle] = useState(false)

  const { saleData, setSaleData } = useSellContext()

  const metodos = [
    { id: 'contado', label: 'Contado', icon: <HandCoins className="text-primary h-10 w-10" /> },
    { id: 'transferencia', label: 'Transferencia', icon: <Landmark className="text-primary h-10 w-10" /> },
    { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="text-primary h-10 w-10" /> },
    { id: 'cuenta_corriente', label: 'Cuenta Corriente', icon: <WalletCards className="text-primary h-10 w-10" /> }
  ]

  // Función corregida para alternar métodos
  const toggleMetodo = (metodo) => {
    setMetodosSeleccionados(prev => {
      const existe = prev.some(m => m.id === metodo.id)

      if (existe) {
        if (metodo.id === 'cuenta_corriente') {
          setClienteCuentaCorriente(null)
        }
        return prev.filter(m => m.id !== metodo.id)
      } else {
        if (metodo.id === 'cuenta_corriente') {
          setMostrarModalCliente(true)
        }
        return [...prev, { ...metodo, monto: 0 }]
      }
    })
  }

  // Función para manejar cambios en los montos
  const handlePaymentAmountChange = (methodId, amount) => {
    setMetodosSeleccionados(prev =>
      prev.map(metodo =>
        metodo.id === methodId
          ? { ...metodo, monto: parseFloat(amount) || 0 }
          : metodo
      )
    )
  }


  const handleSubmit = (e) => {
    e.preventDefault()

    // Validación corregida
    const cuentaCorrienteValida = !metodosSeleccionados.some(m => m.id === 'cuenta_corriente') || clienteCuentaCorriente

    if (metodosSeleccionados.length > 0 && cuentaCorrienteValida) {
      // Guardar en el contexto
      setSaleData(prev => ({
        ...prev,
        payments: metodosSeleccionados.map(m => ({
          method: m.id,
          amount: m.monto,
          details: m.id === 'cuenta_corriente' ? { cliente: clienteCuentaCorriente } : null
        }))
      }))

      setLocation('/confirmacionDatosDeCompra')
    }
  }

  const totalVenta = saleData.total

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Encabezado */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          className="dark:bg-base-300 dark:hover:bg-base-100 rounded-full bg-gray-100 p-2 transition hover:scale-105 hover:bg-gray-200"
          onClick={() => setLocation('/ventas')}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold">Formas de Pago</h1>
      </div>

      {/* Opciones de pago - CORREGIDO: pasar el objeto completo */}
      <div className="mb-12 grid gap-4 sm:grid-cols-4">
        {metodos.map(metodo => (
          <button
            key={metodo.id}
            onClick={() => toggleMetodo(metodo)}
            className={`flex flex-col items-center gap-2 rounded-2xl p-6 shadow-md transition hover:scale-105 hover:shadow-lg ${metodosSeleccionados.some(m => m.id === metodo.id)
              ? 'border-4 border-green-500 bg-green-50 dark:bg-green-950'
              : 'dark:bg-base-300 bg-white'
              }`}
          >
            {metodo.icon}
            <span className="text-sm font-semibold text-gray-700 dark:text-white">
              {metodo.label}
            </span>
          </button>
        ))}
      </div>

      {/* Cliente seleccionado */}
      {metodosSeleccionados.some(m => m.id === 'cuenta_corriente') && clienteCuentaCorriente && (
        <p className="mb-6 font-medium text-green-700">
          Cliente seleccionado: {clienteCuentaCorriente.name}
        </p>
      )}

      {/* Modal Cliente Cuenta Corriente */}
      {mostrarModalCliente && (
        <CuentaCorrienteClientesFP
          isOpen={mostrarModalCliente}
          onClose={() => setMostrarModalCliente(false)}
          onSelectClient={setClienteCuentaCorriente}
        />
      )}

      {/* Detalles de pago */}
      <div>
        <h2 className='text-3xl font-bold items-center mb-4'>Total: {totalVenta}</h2>
        <div className='space-x-2'>
          <div className=''>
            <h2 className='text-xl font-semibold mb-2'>Cantidad a abonar</h2>
            {metodosSeleccionados.length > 1 ? (
              <div className="space-y-4">
                {metodosSeleccionados.map((metodo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 mb-2 rounded-xl bg-white text-gray-700 dark:text-white dark:bg-base-200 shadow-sm w-4/12 hover:shadow-md transition-shadow duration-300">
                    <label className="text-sm font-medium  ">{metodo.label}: $</label>
                    <input
                      type="number"
                      className="w-5/12 p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      onChange={(e) => handlePaymentAmountChange(metodo.id, e.target.value)}
                      value={metodo.monto || ''}
                      min="0"
                      step="0.01"
                    />
                  </div>

                ))}
              </div>
            ) : metodosSeleccionados.length === 1 && (
              <div className="flex items-center justify-between p-2 mb-2 rounded-xl bg-white text-gray-700 dark:text-white dark:bg-base-200 shadow-sm w-4/12 hover:shadow-md transition-shadow duration-300">
                <label className='text-sm font-medium'>{metodosSeleccionados[0].label}: $</label>
                <input
                  type="number"
                  className="w-5/12 p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  onChange={(e) => handlePaymentAmountChange(metodosSeleccionados[0].id, e.target.value)}
                  value={metodosSeleccionados[0].monto || totalVenta}
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            <div className='flex justify-center mt-4'>
              <button
                onClick={() => setMostrarDetalle(!monstrarDetalle)}
                type='button'
                className='btn btn-primary'
              >
                {monstrarDetalle ? 'Ocultar' : 'Mostrar'} Detalle
              </button>
            </div>
            {monstrarDetalle && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-blue-950 rounded-lg">
                <p>Total: {totalVenta}</p>
                <p>Total abonado: {metodosSeleccionados.reduce((sum, m) => sum + (m.monto || 0), 0)}</p>
                <p>Diferencia: {totalVenta - metodosSeleccionados.reduce((sum, m) => sum + (m.monto || 0), 0)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={
            metodosSeleccionados.length === 0 ||
            (metodosSeleccionados.some(m => m.id === 'cuenta_corriente') && !clienteCuentaCorriente)
          }
          className={`rounded-xl px-6 py-3 font-semibold shadow-md transition ${metodosSeleccionados.length > 0 &&
            (!metodosSeleccionados.some(m => m.id === 'cuenta_corriente') || clienteCuentaCorriente)
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-base-300 cursor-not-allowed text-gray-500'
            }`}
          onClick={handleSubmit}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}