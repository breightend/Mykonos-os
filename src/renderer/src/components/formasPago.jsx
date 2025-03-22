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
    { id: 'contado', label: 'Contado', icon: <HandCoins className="text-primary h-10 w-10" /> },
    {
      id: 'transferencia',
      label: 'Transferencia',
      icon: <Landmark className="text-primary h-10 w-10" />
    },
    { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="text-primary h-10 w-10" /> },
    {
      id: 'cuenta_corriente',
      label: 'Cuenta Corriente',
      icon: <WalletCards className="text-primary h-10 w-10" />
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
      // Podría guardar los datos en algún estado global o localStorage si hace falta
      console.log('Métodos seleccionados:', metodosSeleccionados)
      console.log('Cliente cuenta corriente:', clienteCuentaCorriente)
      setLocation('/confirmacionDatosDeCompra')
    }
  }

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

      {/* Opciones de pago */}
      <div className="mb-12 grid gap-4 sm:grid-cols-4">
        {metodos.map((metodo) => (
          <button
            key={metodo.id}
            onClick={() => toggleMetodo(metodo.id)}
            className={`flex flex-col items-center gap-2 rounded-2xl p-6 shadow-md transition hover:scale-105 hover:shadow-lg ${
              metodosSeleccionados.includes(metodo.id)
                ? 'border-4 border-green-500 bg-green-50 dark:bg-green-950'
                : 'dark:bg-base-300 bg-white'
            } `}
          >
            {metodo.icon}
            <span className="text-sm font-semibold text-gray-700 dark:text-white">
              {metodo.label}
            </span>
          </button>
        ))}
      </div>

      {/* Cliente seleccionado */}
      {metodosSeleccionados.includes('cuenta_corriente') && clienteCuentaCorriente && (
        <p className="mb-6 font-medium text-green-700">
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
          className={`rounded-xl px-6 py-3 font-semibold shadow-md transition ${
            metodosSeleccionados.length > 0 &&
            (!metodosSeleccionados.includes('cuenta_corriente') || clienteCuentaCorriente)
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-base-300 cursor-not-allowed text-gray-500'
          } `}
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
