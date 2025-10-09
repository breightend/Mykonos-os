import { ArrowLeft, CreditCard, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import CuentaCorrienteClientesFP from '../componentes especificos/CuentaCorrienteClientesFP'
import { useSellContext } from '../contexts/sellContext'
import { accountMovementsService } from '../services/accountMovements/accountMovementsService'
import { getBancos } from '../services/paymentsServices/banksService'
import paymentMethodsService from '../services/paymentsServices/paymentMethodsService'
import * as icon from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useHashLocation } from 'wouter/use-hash-location'

export default function FormasPago() {
  const [, setLocation] = useHashLocation()
  const [metodosSeleccionados, setMetodosSeleccionados] = useState([])
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState(null)
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [monstrarDetalle, setMostrarDetalle] = useState(false)
  const [cargandoPago, setCargandoPago] = useState(false)
  const [pagoInicial, setPagoInicial] = useState(0)
  const [mostrarPagoInicial, setMostrarPagoInicial] = useState(false)
  const [metodoPagoInicial, setMetodoPagoInicial] = useState('efectivo')
  const [metodosPago, setMetodosPago] = useState([])
  const [bancos, setBancos] = useState([])
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null)
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
  console.log('Metodos seleccionados: ', metodosSeleccionados)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const data = await paymentMethodsService.getClientPaymentMethods()
        if (Array.isArray(data.payment_methods)) {
          setMetodosPago(data.payment_methods)
          // Also set client payment methods for cuenta corriente
          setClientPaymentMethodsCC(data.payment_methods)
        } else {
          setMetodosPago([])
          setClientPaymentMethodsCC([])
        }
      } catch (err) {
        setMetodosPago([])
        setClientPaymentMethodsCC([])
      }
    }
    fetchPaymentMethods()
  }, [])

  const toggleMetodo = (metodo) => {
    setMetodosSeleccionados((prev) => {
      const existe = prev.some((m) => m.id === metodo.id)
      if (existe) {
        if (metodo.method_name === 'cuenta_corriente') {
          setClienteCuentaCorriente(null)
          setCuentaCorrienteMethod(null)
        }
        return prev.filter((m) => m.id !== metodo.id)
      } else {
        if (metodo.method_name === 'cuenta_corriente') {
          setMostrarModalCliente(true)
          // Get the cuenta corriente payment method when selected
          getCuentaCorrientePaymentMethod()
        }
        if (metodo.method_name && metodo.method_name.toLowerCase().includes('tarjeta')) {
          fetchBancos()
        }
        if (prev.length > 0) {
          return [...prev, { ...metodo, monto: 0 }]
        } else {
          return [...prev, { ...metodo, monto: totalVenta }]
        }
      }
    })
  }
  console.log(metodosSeleccionados)

  const fetchBancos = async () => {
    try {
      const data = await getBancos()
      setBancos(data.banks)
    } catch (error) {
      console.error('Error al obtener bancos:', error)
    }
  }

  const handlePaymentAmountChange = (methodId, amount) => {
    setMetodosSeleccionados((prev) =>
      prev.map((metodo) =>
        metodo.id === methodId ? { ...metodo, monto: parseFloat(amount) || 0 } : metodo
      )
    )
  }

  const [clientPaymentMethodsCC, setClientPaymentMethodsCC] = useState([])
  const [cuentaCorrienteMethod, setCuentaCorrienteMethod] = useState(null)

  const getPaymentMethodName = (id) => {
    const metodo = metodosPago.find((m) => m.id === id || m.method_name === id)
    return metodo ? metodo.display_name : id
  }

  // Function to get cuenta corriente payment method
  const getCuentaCorrientePaymentMethod = async () => {
    try {
      const response = await paymentMethodsService.getPaymentMethodCuentaCorriente()
      if (response.success) {
        setCuentaCorrienteMethod(response.payment_method)
        return response.payment_method
      } else {
        console.error('Error getting cuenta corriente payment method:', response.message)
        toast.error('Error al obtener método de pago de cuenta corriente')
        return null
      }
    } catch (error) {
      console.error('Error getting cuenta corriente payment method:', error)
      toast.error('Error al obtener método de pago de cuenta corriente')
      return null
    }
  }
  const handleAgregarPagoCuentaCorriente = async () => {
    if (!clienteCuentaCorriente) {
      alert('Debe seleccionar un cliente primero')
      return
    }

    try {
      setCargandoPago(true)
      const formasDePagoCC = await paymentMethodsService.getClientPaymentMethods()
      setClientPaymentMethodsCC(formasDePagoCC.payment_methods || [])

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
          // Encontrar el payment_method_id para el método de pago inicial
          const metodoPagoInicialObj = metodosPago.find((m) => m.method_name === metodoPagoInicial)

          paymentData.push({
            method: metodoPagoInicial,
            payment_method_id: metodoPagoInicialObj?.id || null,
            amount: pagoInicial,
            description: `Pago inicial (${metodoPagoInicial})`
          })
        }

        // Encontrar el payment_method_id para cuenta corriente
        const cuentaCorrienteMethodId =
          cuentaCorrienteMethod?.id ||
          metodosPago.find((m) => m.method_name === 'cuenta_corriente')?.id

        // Agregar la cuenta corriente con la deuda restante
        paymentData.push({
          method: 'cuenta_corriente',
          payment_method_id: cuentaCorrienteMethodId,
          amount: deudaReal,
          costumer: { cliente: clienteCuentaCorriente },
          movement_id: result.movement_id,
          new_balance: result.new_balance,
          total_amount: result.total_amount,
          partial_payment: result.partial_payment,
          actual_debt: result.actual_debt
        })

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

    // Validación: if cuenta_corriente is selected, must have a client
    const cuentaCorrienteValida =
      !metodosSeleccionados.some((m) => m.method_name === 'cuenta_corriente') ||
      clienteCuentaCorriente

    if (metodosSeleccionados.length > 0 && cuentaCorrienteValida) {
      // Determine customer for sale
      let customerForSale = null
      if (
        metodosSeleccionados.some((m) => m.method_name === 'cuenta_corriente') &&
        clienteCuentaCorriente
      ) {
        customerForSale = {
          id: clienteCuentaCorriente.id,
          name: clienteCuentaCorriente.name,
          dni: clienteCuentaCorriente.dni,
          type: 'cuenta_corriente'
        }
      }
      // Build payments array using new structure
      const payments = metodosSeleccionados.map((m) => {
        // Find the real method info from metodosPago if possible
        let methodInfo = null
        if (m.id && metodosPago.length > 0) {
          methodInfo = metodosPago.find((mp) => mp.id == m.id || mp.method_name === m.method_name)
        }
        // Card payment
        if (m.method_name && m.method_name.toLowerCase().includes('tarjeta')) {
          return {
            method: methodInfo?.method_name || m.method_name,
            payment_method_id: methodInfo?.id || m.id,
            method_name: methodInfo?.method_name || m.method_name,
            label: methodInfo?.display_name || m.label,
            amount: m.monto,
            bank_id: m.banco_id || bancoSeleccionado || null
          }
        }
        return {
          method: methodInfo?.method_name || m.method_name,
          payment_method_id: methodInfo?.id || m.id,
          method_name: methodInfo?.method_name || m.method_name,
          label: methodInfo?.display_name || m.label,
          amount: m.monto,
          costumer:
            m.method_name === 'cuenta_corriente' ? { cliente: clienteCuentaCorriente } : null
        }
      })

      setSaleData((prev) => ({
        ...prev,
        payments: payments,
        customer: customerForSale
      }))

      setLocation('/confirmacionDatosDeCompra')
    }
  }
  const totalVenta = saleData.exchange?.hasExchange ? saleData.exchange.finalAmount : saleData.total

  const renderIcon = (iconName, className = 'h-10 w-10 text-primary') => {
    const IconComponent = icon[iconName]
    return IconComponent ? <IconComponent className={className} /> : null
  }

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
      {/* Opciones de pago */}
      <div className="mb-12 grid gap-4 sm:grid-cols-4">
        {metodosPago.map((metodo, idx) => {
          // Only show one "Tarjeta" button for all card types
          if (metodo.method_name && metodo.method_name.toLowerCase().includes('tarjeta')) {
            if (
              !metodosPago.some(
                (m, i) =>
                  i < idx && m.method_name && m.method_name.toLowerCase().includes('tarjeta')
              )
            ) {
              return (
                <button
                  key="tarjeta"
                  onClick={() =>
                    toggleMetodo({
                      ...metodo,
                      id: 'tarjeta',
                      label: 'Tarjeta',
                      icon_name: 'CreditCard',
                      display_name: 'Tarjeta'
                    })
                  }
                  className={`formas-pago-button flex flex-col items-center gap-2 rounded-2xl p-6 shadow-md transition hover:scale-105 hover:shadow-lg ${
                    metodosSeleccionados.some((m) => m.id === 'tarjeta') ? 'selected' : ''
                  }`}
                >
                  <CreditCard className="h-10 w-10 text-primary" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Tarjeta
                  </span>
                </button>
              )
            } else {
              return null
            }
          }

          return (
            <button
              key={metodo.id}
              onClick={() =>
                toggleMetodo({
                  ...metodo,
                  label: metodo.display_name
                })
              }
              className={`formas-pago-button flex flex-col items-center gap-2 rounded-2xl p-6 shadow-md transition hover:scale-105 hover:shadow-lg ${
                metodosSeleccionados.some((m) => m.id === metodo.id) ? 'selected' : ''
              }`}
            >
              {renderIcon(metodo.icon_name)}
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {metodo.display_name}
              </span>
            </button>
          )
        })}
      </div>
      {/* Cliente seleccionado */}
      {metodosSeleccionados.some((m) => m.method_name === 'cuenta_corriente') &&
        clienteCuentaCorriente && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <p className="font-medium text-green-700 dark:text-green-300">
              Cliente seleccionado: {clienteCuentaCorriente.name}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              DNI/CUIT: {clienteCuentaCorriente.dni}
            </p>
          </div>
        )}

      {/* Tarjetas y bancos */}

      {metodosSeleccionados.some((m) => {
        if (m.id === 'tarjeta') return true
        if (m.method_name && m.method_name.toLowerCase().includes('tarjeta')) return true
        const cardMethod = metodosPago.find((mp) => mp.id == m.id)
        return (
          cardMethod &&
          cardMethod.method_name &&
          cardMethod.method_name.toLowerCase().includes('tarjeta')
        )
      }) && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
          {/* Selección de tarjetas y bancos */}
          <div className="mb-4">
            <label className="mb-1 block font-medium text-blue-700 dark:text-blue-300">
              Selecciona tarjetas y bancos:
            </label>
            {metodosSeleccionados.map((tarjeta, idx) =>
              // Always show if the method is a card (by id or method_name) or if the method is in metodosPago and is a card
              (() => {
                // After changing card type, tarjeta.id may become the real card id (e.g. '2' for debito)
                const isCard = (() => {
                  if (tarjeta.id === 'tarjeta') return true
                  if (
                    tarjeta.method_name &&
                    tarjeta.method_name.toLowerCase().includes('tarjeta')
                  ) {
                    return true
                  }
                  // If id is a number, check if it matches a card in metodosPago
                  const cardMethod = metodosPago.find((m) => m.id == tarjeta.id)
                  return (
                    cardMethod &&
                    cardMethod.method_name &&
                    cardMethod.method_name.toLowerCase().includes('tarjeta')
                  )
                })()
                return isCard
              })() ? (
                <div
                  key={tarjeta._uuid || idx}
                  className="mb-4 rounded-lg border border-blue-200 bg-blue-100 p-4"
                >
                  {/* Tipo de tarjeta */}
                  <div className="mb-2 flex items-center gap-2">
                    <label className="font-medium text-blue-700">Tipo de tarjeta:</label>
                    <select
                      value={tarjeta.id || tarjeta.tipo || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const selected = metodosPago.find((m) => m.id == selectedId)
                        setMetodosSeleccionados((prev) => {
                          // Check for duplicate (same tipo and banco_id)
                          const banco_id = prev[idx]?.banco_id || ''
                          const isDuplicate = prev.some(
                            (m, i) =>
                              i !== idx &&
                              (m.id === selectedId || m.method_name === selected?.method_name) &&
                              m.banco_id === banco_id
                          )
                          if (isDuplicate) {
                            toast.error(
                              'Ya seleccionaste esa combinación de tipo de tarjeta y banco.'
                            )
                            return prev
                          }
                          return prev.map((m, i) =>
                            i === idx
                              ? {
                                  ...m,
                                  id: selected?.id,
                                  method_name: selected?.method_name,
                                  label: selected?.display_name,
                                  tipo: selected?.method_name
                                }
                              : m
                          )
                        })
                      }}
                      className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                    >
                      {metodosPago
                        .filter(
                          (m) => m.method_name && m.method_name.toLowerCase().includes('tarjeta')
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.display_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  {/* Banco */}
                  <div className="mb-2 flex items-center gap-2">
                    <label className="font-medium text-blue-700 dark:text-blue-300">Banco:</label>
                    {Array.isArray(bancos) && bancos.length > 0 ? (
                      <select
                        value={tarjeta.banco_id || ''}
                        onChange={(e) => {
                          const banco_id = e.target.value
                          setMetodosSeleccionados((prev) => {
                            // Check for duplicate (same tipo and banco_id)
                            const tipo = prev[idx]?.tipo || 'tarjeta_credito'
                            const isDuplicate = prev.some(
                              (m, i) =>
                                i !== idx &&
                                m.id === 'tarjeta' &&
                                m.tipo === tipo &&
                                m.banco_id === banco_id
                            )
                            if (isDuplicate) {
                              alert('Ya seleccionaste esa combinación de tipo de tarjeta y banco.')
                              return prev
                            }
                            return prev.map((m, i) => (i === idx ? { ...m, banco_id } : m))
                          })
                        }}
                        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Selecciona un banco</option>
                        {bancos.map((banco) => (
                          <option key={banco.id} value={banco.id}>
                            {banco.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="italic text-gray-500">No hay bancos disponibles</span>
                    )}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="font-medium text-blue-700 dark:text-blue-300">Monto:</label>
                    <input
                      type="text"
                      value={tarjeta.monto || ''}
                      onChange={(e) => {
                        const cleanValue = handleNumericInput(e.target.value)
                        if (cleanValue !== null) {
                          setMetodosSeleccionados((prev) =>
                            prev.map((m, i) =>
                              i === idx ? { ...m, monto: parseFloat(cleanValue) || 0 } : m
                            )
                          )
                        }
                      }}
                      onKeyDown={handleNumericKeyDown}
                      className="w-32 rounded-lg border border-blue-300 p-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-blue-700 dark:bg-blue-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  {/* Eliminar tarjeta si hay más de una */}
                  {metodosSeleccionados.filter((m) => {
                    if (m.id === 'tarjeta') return true
                    if (m.method_name && m.method_name.toLowerCase().includes('tarjeta'))
                      return true
                    const cardMethod = metodosPago.find((mp) => mp.id == m.id)
                    return (
                      cardMethod &&
                      cardMethod.method_name &&
                      cardMethod.method_name.toLowerCase().includes('tarjeta')
                    )
                  }).length > 1 && (
                    <button
                      type="button"
                      className="mt-2 text-red-600 hover:underline"
                      onClick={() => {
                        setMetodosSeleccionados((prev) => prev.filter((_, i) => i !== idx))
                      }}
                    >
                      Quitar tarjeta
                    </button>
                  )}
                </div>
              ) : null
            )}
            {/* Botón para agregar otra tarjeta */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-blue-200 px-3 py-2 text-blue-800 hover:bg-blue-300"
              onClick={() => {
                // Find first card method as default
                const defaultCard = metodosPago.find(
                  (m) => m.method_name && m.method_name.toLowerCase().includes('tarjeta')
                )
                setMetodosSeleccionados((prev) => [
                  ...prev,
                  {
                    id: defaultCard?.id,
                    method_name: defaultCard?.method_name,
                    label: defaultCard?.display_name || 'Tarjeta',
                    banco_id: '',
                    monto: '',
                    _uuid: Date.now() + Math.random()
                  }
                ])
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar otra tarjeta
            </button>
          </div>
        </div>
      )}
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
        {metodosSeleccionados.some((m) => m.method_name === 'cuenta_corriente') ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
              <h3 className="mb-4 text-xl font-semibold text-blue-800 dark:text-blue-200">
                Pago a Cuenta Corriente
              </h3>

              {/* Información de la venta */}
              <div className="mb-4 rounded-lg bg-base-100 p-4">
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
                        {clientPaymentMethodsCC &&
                          clientPaymentMethodsCC.map((method) => (
                            <option key={method.id} value={method.method_name}>
                              {method.display_name}
                            </option>
                          ))}
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
      {!metodosSeleccionados.some((m) => m.method_name === 'cuenta_corriente') && (
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
      <Toaster position="center" />
    </div>
  )
}
