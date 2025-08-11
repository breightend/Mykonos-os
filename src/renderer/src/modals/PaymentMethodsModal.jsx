import { useState, useEffect } from 'react'
import { X, Plus, Edit3, Trash2, Check, AlertCircle, CreditCard } from 'lucide-react'
import { paymentMethodsService } from '../services/paymentMethodsService'
import toast from 'react-hot-toast'

export default function PaymentMethodsModal({ isOpen, onClose }) {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    method_name: '',
    display_name: '',
    description: '',
    requires_reference: false,
    icon_name: 'DollarSign'
  })

  const iconOptions = [
    { value: 'HandCoins', label: 'Efectivo', icon: '💵' },
    { value: 'CreditCard', label: 'Tarjeta', icon: '💳' },
    { value: 'Landmark', label: 'Banco', icon: '🏦' },
    { value: 'CheckCircle', label: 'Cheque', icon: '✅' },
    { value: 'FileText', label: 'Documento', icon: '📄' },
    { value: 'DollarSign', label: 'Dinero', icon: '💰' },
    { value: 'Smartphone', label: 'Digital', icon: '📱' },
    { value: 'Coins', label: 'Monedas', icon: '🪙' }
  ]

  // Load payment methods
  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await paymentMethodsService.getAllPaymentMethods()
      if (response.success) {
        setPaymentMethods(response.payment_methods || [])
      } else {
        toast.error('Error cargando métodos de pago')
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast.error('Error cargando métodos de pago')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods()
    }
  }, [isOpen])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Generate method_name from display_name
  const generateMethodName = (displayName) => {
    return displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }

  // Handle display name change and auto-generate method name
  const handleDisplayNameChange = (e) => {
    const displayName = e.target.value
    setFormData((prev) => ({
      ...prev,
      display_name: displayName,
      method_name: editingMethod ? prev.method_name : generateMethodName(displayName)
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      method_name: '',
      display_name: '',
      description: '',
      requires_reference: false,
      icon_name: 'DollarSign'
    })
    setEditingMethod(null)
    setShowAddForm(false)
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.display_name.trim()) {
      toast.error('El nombre para mostrar es requerido')
      return
    }

    if (!formData.method_name.trim()) {
      toast.error('El nombre interno es requerido')
      return
    }

    try {
      setLoading(true)
      let result

      if (editingMethod) {
        // Update existing method
        const updateData = {
          display_name: formData.display_name,
          description: formData.description,
          requires_reference: formData.requires_reference,
          icon_name: formData.icon_name
        }
        result = await paymentMethodsService.updatePaymentMethod(editingMethod.id, updateData)
      } else {
        // Create new method
        result = await paymentMethodsService.createPaymentMethod(formData)
      }

      if (result.success) {
        toast.success(editingMethod ? 'Método de pago actualizado' : 'Método de pago creado')
        resetForm()
        await loadPaymentMethods()
      } else {
        toast.error(result.message || 'Error guardando método de pago')
      }
    } catch (error) {
      console.error('Error saving payment method:', error)
      toast.error('Error guardando método de pago')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (method) => {
    setFormData({
      method_name: method.method_name,
      display_name: method.display_name,
      description: method.description || '',
      requires_reference: Boolean(method.requires_reference),
      icon_name: method.icon_name || 'DollarSign'
    })
    setEditingMethod(method)
    setShowAddForm(true)
  }

  // Handle delete/deactivate
  const handleDelete = async (method) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres ${method.is_active ? 'desactivar' : 'activar'} "${method.display_name}"?`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      let result

      if (method.is_active) {
        result = await paymentMethodsService.deletePaymentMethod(method.id)
      } else {
        result = await paymentMethodsService.activatePaymentMethod(method.id)
      }

      if (result.success) {
        toast.success(method.is_active ? 'Método de pago desactivado' : 'Método de pago activado')
        await loadPaymentMethods()
      } else {
        toast.error(result.message || 'Error actualizando método de pago')
      }
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast.error('Error actualizando método de pago')
    } finally {
      setLoading(false)
    }
  }

  // Initialize default methods
  const handleInitializeDefaults = async () => {
    try {
      setLoading(true)
      const result = await paymentMethodsService.initializeDefaultPaymentMethods()

      if (result.success) {
        toast.success('Métodos de pago predeterminados inicializados')
        await loadPaymentMethods()
      } else {
        toast.error('Error inicializando métodos predeterminados')
      }
    } catch (error) {
      console.error('Error initializing defaults:', error)
      toast.error('Error inicializando métodos predeterminados')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gestión de Métodos de Pago</h2>
                <p className="text-sm text-white/80">
                  Configura los métodos de pago disponibles en el sistema
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm px-3 py-2 text-white hover:bg-white/10 hover:text-error"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {/* Action buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary gap-2"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Agregar Método
            </button>
            <button
              onClick={handleInitializeDefaults}
              className="btn btn-outline gap-2"
              disabled={loading}
            >
              <Check className="h-4 w-4" />
              Inicializar Predeterminados
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 rounded-lg bg-base-200 p-4">
              <h3 className="mb-4 text-lg font-bold">
                {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Display Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Nombre para mostrar *</span>
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleDisplayNameChange}
                      className="input-bordered input w-full"
                      placeholder="ej: Tarjeta de Crédito"
                      required
                    />
                  </div>

                  {/* Method Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Nombre interno *</span>
                    </label>
                    <input
                      type="text"
                      name="method_name"
                      value={formData.method_name}
                      onChange={handleInputChange}
                      className="input-bordered input w-full"
                      placeholder="ej: tarjeta_credito"
                      disabled={!!editingMethod}
                      required
                    />
                    {editingMethod && (
                      <label className="label">
                        <span className="label-text-alt">
                          No se puede modificar el nombre interno
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Descripción</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="textarea-bordered textarea"
                    placeholder="Descripción opcional del método de pago"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Icon */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Icono</span>
                    </label>
                    <select
                      name="icon_name"
                      value={formData.icon_name}
                      onChange={handleInputChange}
                      className="select-bordered select w-full"
                    >
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Requires Reference */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Configuración</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        name="requires_reference"
                        checked={formData.requires_reference}
                        onChange={handleInputChange}
                        className="checkbox checkbox-primary"
                      />
                      <span className="label-text">Requiere número de comprobante</span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : editingMethod ? 'Actualizar' : 'Crear'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-ghost">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Methods List */}
          <div className="space-y-3">
            <h3 className="mb-4 text-lg font-bold">
              Métodos de Pago Configurados ({paymentMethods.length})
            </h3>

            {loading && paymentMethods.length === 0 ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>No hay métodos de pago configurados</p>
                <p className="text-sm">Haz clic en Inicializar Predeterminados para comenzar</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`card border-l-4 bg-base-100 shadow ${
                      method.is_active ? 'border-l-success' : 'border-l-error'
                    }`}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`badge ${method.is_active ? 'badge-success' : 'badge-error'}`}
                          >
                            {method.is_active ? 'Activo' : 'Inactivo'}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold">{method.display_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                Interno:{' '}
                                <code className="rounded bg-gray-100 px-1">
                                  {method.method_name}
                                </code>
                              </span>
                              {method.requires_reference && (
                                <span className="badge badge-info badge-sm">
                                  Requiere comprobante
                                </span>
                              )}
                              {method.icon_name && <span>Icono: {method.icon_name}</span>}
                            </div>
                            {method.description && (
                              <p className="mt-1 text-sm text-gray-600">{method.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(method)}
                            className="btn btn-ghost btn-sm"
                            disabled={loading}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(method)}
                            className={`btn btn-ghost btn-sm ${method.is_active ? 'hover:bg-error/10 text-error' : 'hover:bg-success/10 text-success'}`}
                            disabled={loading}
                          >
                            {method.is_active ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
