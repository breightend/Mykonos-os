import { ArrowLeft, CreditCard, HandCoins, Landmark, WalletCards, Plus } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState } from 'react'
import CuentaCorrienteClientesFP from '../componentes especificos/CuentaCorrienteClientesFP'
import { useSellContext } from '../contexts/sellContext'
import { accountMovementsService } from '../services/accountMovements/accountMovementsService'

export default function FormasPago() {
  const [, setLocation] = useLocation()
  const [metodosSeleccionados, setMetodosSeleccionados] = useState([])
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState(null)
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [monstrarDetalle, setMostrarDetalle] = useState(false)
  const [cargandoPago, setCargandoPago] = useState(false)
  const [pagoInicial, setPagoInicial] = useState(0)
  const [mostrarPagoInicial, setMostrarPagoInicial] = useState(false)
  const [metodoPagoInicial, setMetodoPagoInicial] = useState('efectivo')
  const { saleData, setSaleData } = useSellContext()

  const handleNumericInput = (value) => {
    const cleanValue = value.replace(/[^0-9.]/g, '')
    return cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue) ? cleanValue : null
  }

  const handleNumericKeyDown = (e) => {
    if (
      [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Permitir: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return
    }
    // Prevenir si no es un número
    if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault()
    }
  }

  const getPaymentMethodName = (method) => {
    const methods = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta_debito: 'Tarjeta de Débito',
      tarjeta_credito: 'Tarjeta de Crédito',
      cheque: 'Cheque'
    }
    return methods[method] || method
  }

  const metodos = [
    { id: 'contado', label: 'Contado', icon: <HandCoins className="h-10 w-10 text-primary" /> },
    {
      id: 'transferencia',
      label: 'Transferencia',
      icon: <Landmark className="h-10 w-10 text-primary" />
    },
    { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="h-10 w-10 text-primary" /> },
    {
      id: 'cuenta_corriente',
      label: 'Cuenta Corriente',
      icon: <WalletCards className="h-10 w-10 text-primary" />
    }
  ]

  const toggleMetodo = (metodo) => {
    setMetodosSeleccionados((prev) => {
      const existe = prev.some((m) => m.id === metodo.id)

      if (existe) {
        if (metodo.id === 'cuenta_corriente') {
          setClienteCuentaCorriente(null)
        }
        return prev.filter((m) => m.id !== metodo.id)
      } else {
        if (metodo.id === 'cuenta_corriente') {
          setMostrarModalCliente(true)
        }
        if (metodosSeleccionados.length > 0) {
          return [...prev, { ...metodo, monto: 0 }]
        } else {
          return [...prev, { ...metodo, monto: totalVenta }] // Inicializa con el totalVenta
        }
      }
    })
  }

  // Función para manejar cambios en los montos
  const handlePaymentAmountChange = (methodId, amount) => {
    setMetodosSeleccionados((prev) =>
      prev.map((metodo) =>
        metodo.id === methodId ? { ...metodo, monto: parseFloat(amount) || 0 } : metodo
      )
    )
  }

  // Función para agregar pago a cuenta corriente
  const handleAgregarPagoCuentaCorriente = async () => {
    if (!clienteCuentaCorriente) {
      alert('Debe seleccionar un cliente primero')
      return
    }

    try {
      setCargandoPago(true)

      const deudaReal = totalVenta - pagoInicial

      const result = await accountMovementsService.createDebitMovement({
        entity_id: clienteCuentaCorriente.id,
        amount: totalVenta,
        description: `Venta a cuenta corriente - Total: $${totalVenta}${pagoInicial > 0 ? ` - Pago inicial (${metodoPagoInicial}): $${pagoInicial}` : ''}`,
        purchase_id: null,
        partial_payment: pagoInicial,
        partial_payment_method: metodoPagoInicial
      })

      if (result.success) {
        const paymentData = []

        if (pagoInicial > 0) {
          paymentData.push({
            method: metodoPagoInicial,
            amount: pagoInicial,
            description: `Pago inicial (${metodoPagoInicial})`
          })
        }

        // Agregar la cuenta corriente con la deuda restante
        paymentData.push({
          method: 'cuenta_corriente',
          amount: deudaReal,
          costumer: { cliente: clienteCuentaCorriente },
          movement_id: result.movement_id,
          new_balance: result.new_balance,
          total_amount: result.total_amount,
          partial_payment: result.partial_payment,
          actual_debt: result.actual_debt
        })

        // Actualizar el contexto de venta
        setSaleData((prev) => ({
          ...prev,
          payments: paymentData,
          customer: {
            id: clienteCuentaCorriente.id,
            name: clienteCuentaCorriente.name,
            dni: clienteCuentaCorriente.dni,
            type: 'cuenta_corriente'
          }
        }))

        const mensaje =
          pagoInicial > 0
            ? `Pago agregado exitosamente!\n• Total de la venta: $${totalVenta}\n• Pago inicial (${getPaymentMethodName(metodoPagoInicial)}): $${pagoInicial}\n• Deuda agregada a cuenta corriente: $${deudaReal}\n• Nuevo saldo del cliente: $${result.new_balance}`
            : `Pago agregado exitosamente!\n• Total agregado a cuenta corriente: $${totalVenta}\n• Nuevo saldo del cliente: $${result.new_balance}`

        alert(mensaje)
        setLocation('/confirmacionDatosDeCompra')
      } else {
        alert(`Error al agregar pago: ${result.message}`)
      }
    } catch (error) {
      console.error('Error al agregar pago:', error)
      alert('Error al agregar pago. Intente nuevamente.')
    } finally {
      setCargandoPago(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validación corregida
    const cuentaCorrienteValida =
      !metodosSeleccionados.some((m) => m.id === 'cuenta_corriente') || clienteCuentaCorriente

    if (metodosSeleccionados.length > 0 && cuentaCorrienteValida) {
      // Determinar el cliente para la venta
      let customerForSale = null
      if (metodosSeleccionados.some((m) => m.id === 'cuenta_corriente') && clienteCuentaCorriente) {
        customerForSale = {
          id: clienteCuentaCorriente.id,
          name: clienteCuentaCorriente.name,
          dni: clienteCuentaCorriente.dni,
          type: 'cuenta_corriente'
        }
      }

      // Guardar en el contexto
      setSaleData((prev) => ({
        ...prev,
        payments: metodosSeleccionados.map((m) => ({
          method: m.id,
          amount: m.monto,
          costumer: m.id === 'cuenta_corriente' ? { cliente: clienteCuentaCorriente } : null
        })),
        customer: customerForSale
      }))

      setLocation('/confirmacionDatosDeCompra')
    }
  }
  const totalVenta = saleData.exchange?.hasExchange ? saleData.exchange.finalAmount : saleData.total

  return (
    <div className="formas-pago mx-auto max-w-4xl p-6">
      {/* Encabezado */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          className="back-button rounded-full bg-gray-100 p-2 transition hover:scale-105 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={() => setLocation('/ventas')}
        >
          <ArrowLeft className="back-button-icon h-6 w-6 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Formas de Pago</h1>
      </div>

      {/* Opciones de pago - CORREGIDO: pasar el objeto completo */}
      <div className="mb-12 grid gap-4 sm:grid-cols-4">
        {metodos.map((metodo) => (
          <button
            key={metodo.id}
            onClick={() => toggleMetodo(metodo)}
            className={`formas-pago-button flex flex-col items-center gap-2 rounded-2xl p-6 shadow-md transition hover:scale-105 hover:shadow-lg ${
              metodosSeleccionados.some((m) => m.id === metodo.id) ? 'selected' : ''
            }`}
          >
            {metodo.icon}
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {metodo.label}
            </span>
          </button>
        ))}
      </div>

      {/* Cliente seleccionado */}
      {metodosSeleccionados.some((m) => m.id === 'cuenta_corriente') && clienteCuentaCorriente && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="font-medium text-green-700 dark:text-green-300">
            Cliente seleccionado: {clienteCuentaCorriente.name}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            DNI/CUIT: {clienteCuentaCorriente.dni}
          </p>
        </div>
      )}
      
      {metodosSeleccionados.some((m) => m.id === 'tarjeta') && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="font-medium text-blue-700 dark:text-blue-300">
            Elije:{' '}
            <select>
              <option value="tarjeta_credito">Tarjeta de Crédito</option>
              <option value="tarjeta_debito">Tarjeta de Débito</option>
            </select>
          </p>
          <p>
            Elige el banco:{' '}
            <select>
              <option value="banco1">Banco 1</option>
              <option value="banco2">Banco 2</option>
              <option value="banco3">Banco 3</option>
            </select>
          </p>
        </div>
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
        <h2 className="mb-4 items-center text-3xl font-bold">Total: {totalVenta}</h2>

        {/* Si hay cuenta corriente seleccionada, mostrar interfaz especial */}
        {metodosSeleccionados.some((m) => m.id === 'cuenta_corriente') ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
              <h3 className="mb-4 text-xl font-semibold text-blue-800 dark:text-blue-200">
                💳 Pago a Cuenta Corriente
              </h3>

              {/* Información de la venta */}
              <div className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      Total de la venta:
                    </span>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      ${totalVenta}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Cliente:</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {clienteCuentaCorriente?.name || 'Seleccione un cliente'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Opción de pago inicial */}
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                    ¿El cliente realizará un pago inicial?
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarPagoInicial(!mostrarPagoInicial)
                      if (mostrarPagoInicial) {
                        setPagoInicial(0)
                      }
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      mostrarPagoInicial
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {mostrarPagoInicial ? 'No, todo a cuenta corriente' : 'Sí, hay pago inicial'}
                  </button>
                </div>

                {mostrarPagoInicial && (
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                    {/* Selección del método de pago */}
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-green-800 dark:text-green-200">
                        Método de pago inicial:
                      </label>
                      <select
                        value={metodoPagoInicial}
                        onChange={(e) => setMetodoPagoInicial(e.target.value)}
                        className="w-full rounded-lg border border-green-300 p-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">🏦 Transferencia</option>
                        <option value="tarjeta_debito">💳 Tarjeta de Débito</option>
                        <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                        <option value="cheque">📄 Cheque</option>
                      </select>
                    </div>

                    <label className="mb-2 block text-sm font-medium text-green-800 dark:text-green-200">
                      Monto del pago inicial:
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-800 dark:text-green-200">
                        $
                      </span>
                      <input
                        type="text"
                        value={pagoInicial}
                        onChange={(e) => {
                          const cleanValue = handleNumericInput(e.target.value)
                          if (cleanValue !== null) {
                            setPagoInicial(parseFloat(cleanValue) || 0)
                          }
                        }}
                        onKeyDown={handleNumericKeyDown}
                        className="flex-1 rounded-lg border border-green-300 p-3 text-center text-lg font-bold focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      Máximo: ${totalVenta}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen del pago */}
              <div className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                <h4 className="mb-3 font-medium text-gray-800 dark:text-gray-200">
                  Resumen del pago:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Total de la venta:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      ${totalVenta}
                    </span>
                  </div>
                  {mostrarPagoInicial && pagoInicial > 0 && (
                    <>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Pago inicial ({getPaymentMethodName(metodoPagoInicial)}):</span>
                        <span className="font-bold">-${pagoInicial}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-blue-800 dark:text-blue-200">
                      Deuda a cuenta corriente:
                    </span>
                    <span className="text-blue-800 dark:text-blue-200">
                      ${(totalVenta - pagoInicial).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón para agregar el pago */}
              <button
                onClick={handleAgregarPagoCuentaCorriente}
                disabled={!clienteCuentaCorriente || cargandoPago || pagoInicial > totalVenta}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold shadow-md transition ${
                  clienteCuentaCorriente && !cargandoPago && pagoInicial <= totalVenta
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
              >
                <Plus className="h-5 w-5" />
                {cargandoPago ? 'Procesando...' : 'Confirmar Pago a Cuenta Corriente'}
              </button>

              {pagoInicial > totalVenta && (
                <p className="mt-2 text-sm text-red-600">
                  El pago inicial no puede ser mayor al total de la venta
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-x-2">
            <div className="">
              <h2 className="mb-2 text-xl font-semibold">Cantidad a abonar</h2>
              {metodosSeleccionados.length > 1 ? (
                <div className="space-y-4">
                  {metodosSeleccionados.map((metodo, index) => (
                    <div
                      key={index}
                      className="payment-container mb-2 flex w-4/12 items-center justify-between rounded-xl p-2 shadow-sm transition-shadow duration-300 hover:shadow-md"
                    >
                      <label className="text-sm font-medium">{metodo.label}: $</label>
                      <input
                        type="text"
                        className="payment-input w-5/12 rounded-lg p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => {
                          const cleanValue = handleNumericInput(e.target.value)
                          if (cleanValue !== null) {
                            handlePaymentAmountChange(metodo.id, cleanValue)
                          }
                        }}
                        onKeyDown={handleNumericKeyDown}
                        value={metodo.monto || ''}
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                metodosSeleccionados.length === 1 && (
                  <div className="payment-container mb-2 flex w-4/12 items-center justify-between rounded-xl p-2 shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <label className="text-sm font-medium">
                      {metodosSeleccionados[0].label}: $
                    </label>
                    <input
                      type="text"
                      className="payment-input w-5/12 rounded-lg p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const cleanValue = handleNumericInput(e.target.value)
                        if (cleanValue !== null) {
                          handlePaymentAmountChange(metodosSeleccionados[0].id, cleanValue)
                        }
                      }}
                      onKeyDown={handleNumericKeyDown}
                      value={metodosSeleccionados[0].monto || ''}
                      defaultValue={totalVenta}
                      placeholder="0.00"
                    />
                  </div>
                )
              )}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setMostrarDetalle(!monstrarDetalle)}
                  type="button"
                  className="btn btn-primary"
                >
                  {monstrarDetalle ? 'Ocultar' : 'Mostrar'} Detalle
                </button>
              </div>
              {monstrarDetalle && (
                <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-blue-950">
                  <p>Total: {totalVenta}</p>
                  <p>
                    Total abonado:{' '}
                    {metodosSeleccionados.reduce((sum, m) => sum + (m.monto || 0), 0)}
                  </p>
                  <p>
                    Diferencia:{' '}
                    {totalVenta - metodosSeleccionados.reduce((sum, m) => sum + (m.monto || 0), 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botón Aceptar - Solo mostrar si NO hay cuenta corriente seleccionada */}
      {!metodosSeleccionados.some((m) => m.id === 'cuenta_corriente') && (
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={metodosSeleccionados.length === 0}
            className={`rounded-xl px-6 py-3 font-semibold shadow-md transition ${
              metodosSeleccionados.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'cursor-not-allowed bg-gray-300 text-gray-500'
            }`}
            onClick={handleSubmit}
          >
            Aceptar
          </button>
        </div>
      )}
    </div>
  )
}
