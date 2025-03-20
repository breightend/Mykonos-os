import { ArrowLeft, CreditCard, HandCoins, Landmark, WalletCards } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState, useEffect } from 'react'
import CuentaCorrienteClientesFP from '../componentes especificos/CuentaCorrienteClientesFP'


export default function FormasPago() {
  const [, setLocation] = useLocation()
  const [metodosSeleccionados, setMetodosSeleccionados] = useState('')
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState(null)
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)

  const metodos = [
    { id: 'contado', label: 'Contado', icon: <HandCoins className="w-10 h-10 text-primary" /> },
    {
      id: 'transferencia',
      label: 'Transferencia',
      icon: <Landmark className="w-10 h-10 text-primary" />
    },
    { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="w-10 h-10 text-primary" /> },
    {
      id: 'cuenta_corriente',
      label: 'Cuenta Corriente',
      icon: <WalletCards className="w-10 h-10 text-primary" />
    }
  ]

  const toggleMetodo = (id) => {
    setMetodosSeleccionados((prev) => {
      const updated = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]

      // Si se selecciona cuenta corriente y no está ya abierto el modal
      if (id === 'cuenta_corriente' && !prev.includes(id)) {
        setMostrarModalCliente(true)
      }

      // Si se deselecciona cuenta corriente, limpiamos el cliente
      if (id === 'cuenta_corriente' && prev.includes(id)) {
        setClienteCuentaCorriente(null)
      }

      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Verificamos que si está seleccionada cuenta corriente, también haya un cliente
    if (
      metodosSeleccionados.length > 0 &&
      (!metodosSeleccionados.includes('cuenta_corriente') || clienteCuentaCorriente)
    ) {
      // Podrías guardar los datos en algún estado global o localStorage si hace falta
      console.log('Métodos seleccionados:', metodosSeleccionados)
      console.log('Cliente cuenta corriente:', clienteCuentaCorriente)
      setLocation('/confirmacionDatosDeCompra')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          className="p-2 rounded-full bg-gray-100 dark:bg-base-300 hover:bg-gray-200 dark:hover:bg-base-100 transition hover:scale-105"
          onClick={() => setLocation('/ventas')}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold ">Formas de Pago</h1>
      </div>

      {/* Opciones de pago */}
      <div className="grid sm:grid-cols-4 gap-4 mb-12">
        {metodos.map((metodo) => (
          <button
            key={metodo.id}
            onClick={() => toggleMetodo(metodo.id)}
            className={`flex flex-col items-center gap-2 p-6 rounded-2xl shadow-md hover:shadow-lg transition hover:scale-105
              ${
                metodosSeleccionados.includes(metodo.id)
                  ? 'border-4 border-green-500 bg-green-50 dark:bg-green-950'
                  : 'bg-white dark:bg-base-300'
              }
            `}
          >
            {metodo.icon}
            <span className="text-sm font-semibold text-gray-700 dark:text-white">{metodo.label}</span>
          </button>
        ))}
      </div>

      {/* Cliente seleccionado */}
      {metodosSeleccionados.includes('cuenta_corriente') && clienteCuentaCorriente && (
        <p className="mb-6 text-green-700 font-medium">
          Cliente seleccionado: {clienteCuentaCorriente.name}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            metodosSeleccionados.length === 0 ||
            (metodosSeleccionados.includes('cuenta_corriente') && !clienteCuentaCorriente)
          }
          className={`px-6 py-3 rounded-xl font-semibold shadow-md transition
            ${
              metodosSeleccionados.length > 0 &&
              (!metodosSeleccionados.includes('cuenta_corriente') || clienteCuentaCorriente)
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-base-300 text-gray-500 cursor-not-allowed'
            }
          `}
          onClick={handleSubmit}
        >
          Aceptar
        </button>
      </div>

      {/* Modal Cliente Cuenta Corriente */}
      {mostrarModalCliente && (
        <CuentaCorrienteClientesFP
          isOpen={mostrarModalCliente}
          onClose={() => setMostrarModalCliente(false)}
          onSelectClient={(cliente) => {
            setClienteCuentaCorriente(cliente)
            setMostrarModalCliente(false)
          }}
        />
      )}
    </div>
  )
}
