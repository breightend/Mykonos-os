import { ArrowLeft, Trash2, Gift, Replace } from 'lucide-react'
import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useLocation } from 'wouter'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { useSellContext } from '../contexts/sellContext'
import salesService from '../services/salesService'

//TODO agregar el vendedor a la venta
//TODO agregar logica de regalos

function Ventas() {
  const [, setLocation] = useLocation()
  const [codigoInput, setCodigoInput] = useState('')
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadAEliminar, setCantidadAEliminar] = useState(0)
  const [loading, setLoading] = useState(false)

  // Estados para el intercambio
  const [modoIntercambio, setModoIntercambio] = useState(false)
  const [codigoDevolucionInput, setCodigoDevolucionInput] = useState('')
  const [productosDevolucion, setProductosDevolucion] = useState([])
  const [loadingDevolucion, setLoadingDevolucion] = useState(false)

  const { setSaleData, saleData, addProductToGifts, removeGiftProduct, updateGiftQuantity } =
    useSellContext()

  const agregarProductoDevolucion = async () => {
    const codigo = codigoDevolucionInput.trim()
    if (!codigo) {
      toast.error('Por favor ingrese un código de barras de variante para devolución', {
        duration: 2000
      })
      return
    }

    setLoadingDevolucion(true)
    try {
      console.log('🔍 Buscando producto de devolución por código de variante:', codigo)

      const response = await salesService.getProductByVariantBarcode(codigo)

      if (response.status === 'success') {
        const productData = response.data
        console.log('✅ Producto de devolución encontrado:', productData)

        const existingProductIndex = productosDevolucion.findIndex(
          (p) => p.variant_barcode === codigo
        )

        if (existingProductIndex !== -1) {
          const nuevosProductos = [...productosDevolucion]
          nuevosProductos[existingProductIndex].cantidad += 1
          setProductosDevolucion(nuevosProductos)
          toast.success(`Cantidad de devolución incrementada: ${productData.product_name}`, {
            duration: 2000
          })
        } else {
          const nuevoProductoDevolucion = {
            variant_barcode: productData.variant_barcode,
            product_id: productData.product_id,
            descripcion: productData.product_name,
            marca: productData.brand_name || 'Sin marca',
            precio: productData.sale_price || 0,
            cantidad: 1,
            grupo: productData.group_name || 'Sin grupo',
            talle: productData.size_name || 'Sin talle',
            color: productData.color_name || 'Sin color',
            color_hex: productData.color_hex || '#808080',
            variant_id: productData.variant_id,
            size_id: productData.size_id,
            color_id: productData.color_id,
            sucursal_id: productData.sucursal_id,
            sucursal_nombre: productData.sucursal_nombre,
            tax: productData.tax || 0,
            discount: productData.discount || 0
          }

          setProductosDevolucion([...productosDevolucion, nuevoProductoDevolucion])
          toast.success(
            `Producto de devolución agregado: ${productData.product_name} - ${productData.size_name} - ${productData.color_name}`,
            {
              duration: 3000
            }
          )
        }

        setCodigoDevolucionInput('')
      } else {
        toast.error(response.message || 'Producto de devolución no encontrado', {
          duration: 3000
        })
      }
    } catch (error) {
      console.error('❌ Error buscando producto de devolución:', error)

      if (error.response?.status === 404) {
        toast.error('Producto de devolución no encontrado', {
          duration: 3000
        })
      } else {
        toast.error('Error en la búsqueda del producto de devolución', {
          duration: 2000
        })
      }
    } finally {
      setLoadingDevolucion(false)
    }
  }

  const eliminarProductoDevolucion = (variantBarcode) => {
    setProductosDevolucion(productosDevolucion.filter((p) => p.variant_barcode !== variantBarcode))
    toast.success('Producto de devolución eliminado', { duration: 2000 })
  }

  const toggleModoIntercambio = () => {
    setModoIntercambio(!modoIntercambio)
    if (!modoIntercambio) {
      // Limpiar productos de devolución al entrar al modo intercambio
      setProductosDevolucion([])
      setCodigoDevolucionInput('')
    }
  }

  const agregarProducto = async () => {
    const codigo = codigoInput.trim()
    if (!codigo) {
      toast.error('Por favor ingrese un código de barras de variante', {
        duration: 2000
      })
      return
    }

    setLoading(true)
    try {
      console.log('🔍 Buscando producto por código de variante:', codigo)

      const response = await salesService.getProductByVariantBarcode(codigo)

      if (response.status === 'success') {
        const productData = response.data
        console.log('✅ Producto encontrado:', productData)

        const existingProductIndex = productos.findIndex((p) => p.variant_barcode === codigo)

        if (existingProductIndex !== -1) {
          const nuevosProductos = [...productos]
          const cantidadActual = nuevosProductos[existingProductIndex].cantidad
          const stockDisponible = productData.stock_disponible

          if (cantidadActual < stockDisponible) {
            nuevosProductos[existingProductIndex].cantidad += 1
            setProductos(nuevosProductos)
            toast.success(`Cantidad incrementada: ${productData.product_name}`, {
              duration: 2000
            })
          } else {
            toast.error('No hay suficiente stock disponible', {
              duration: 2000
            })
          }
        } else {
          const nuevoProducto = {
            variant_barcode: productData.variant_barcode,
            product_id: productData.product_id,
            descripcion: productData.product_name,
            marca: productData.brand_name || 'Sin marca',
            precio: productData.sale_price || 0,
            cantidad: 1,
            grupo: productData.group_name || 'Sin grupo',
            talle: productData.size_name || 'Sin talle',
            color: productData.color_name || 'Sin color',
            color_hex: productData.color_hex || '#808080',
            stock_disponible: productData.stock_disponible,
            variant_id: productData.variant_id,
            size_id: productData.size_id,
            color_id: productData.color_id,
            sucursal_id: productData.sucursal_id,
            sucursal_nombre: productData.sucursal_nombre,
            tax: productData.tax || 0,
            discount: productData.discount || 0
          }

          setProductos([...productos, nuevoProducto])
          toast.success(
            `Producto agregado: ${productData.product_name} - ${productData.size_name} - ${productData.color_name}`,
            {
              duration: 3000
            }
          )
        }

        setCodigoInput('')
      } else {
        toast.error(response.message || 'Producto no encontrado', {
          duration: 3000
        })
      }
    } catch (error) {
      console.error('❌ Error buscando producto:', error)

      if (error.response?.status === 404) {
        toast.error('Producto no encontrado o sin stock disponible', {
          duration: 3000
        })
      } else {
        toast.error('Error en la búsqueda del producto', {
          duration: 2000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const eliminarProducto = () => {
    if (!productoSeleccionado) return

    const index = productos.findIndex(
      (p) => p.variant_barcode === productoSeleccionado.variant_barcode
    )
    if (index === -1) return

    let cantidadEliminar = cantidadAEliminar || 1
    const eliminarTodos = document.getElementById('eliminarTodosCheckbox')?.checked

    if (eliminarTodos || cantidadEliminar >= productos[index].cantidad) {
      setProductos(
        productos.filter((p) => p.variant_barcode !== productoSeleccionado.variant_barcode)
      )
    } else {
      // Resta la cantidad indicada
      const nuevosProductos = [...productos]
      nuevosProductos[index].cantidad -= cantidadEliminar
      setProductos(nuevosProductos)
    }

    setProductoSeleccionado(null)
    setCantidadAEliminar(0)
  }

  const addToGifts = () => {
    if (!productoSeleccionado) {
      toast.error('Por favor seleccione un producto', { duration: 2000 })
      return
    }

    const result = addProductToGifts(productoSeleccionado, productos)

    if (result.success) {
      toast.success(`${productoSeleccionado.descripcion} agregado a regalos`, { duration: 2000 })
    } else {
      toast.error(result.message, { duration: 3000 })
    }
  }

  const removeFromGifts = (variantBarcode) => {
    removeGiftProduct(variantBarcode)
    toast.success('Producto removido de regalos', { duration: 2000 })
  }

  const handleSubmit = () => {
    const total = productos.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0)
    const totalDevolucion = productosDevolucion.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    )

    // Si hay intercambio, el total final es la diferencia
    const totalFinal = modoIntercambio ? total - totalDevolucion : total

    setSaleData((prev) => ({
      ...prev, // Conserva el estado existente
      products: productos.map((p) => ({
        variant_barcode: p.variant_barcode,
        product_id: p.product_id,
        variant_id: p.variant_id,
        description: p.descripcion,
        brand: p.marca,
        size_name: p.talle,
        color_name: p.color,
        color_hex: p.color_hex,
        price: p.precio,
        quantity: p.cantidad,
        size_id: p.size_id,
        color_id: p.color_id,
        sucursal_id: p.sucursal_id,
        sucursal_nombre: p.sucursal_nombre,
        group_name: p.grupo,
        tax: p.tax,
        discount: p.discount
      })),
      // Guardar datos del intercambio si existe
      exchange: modoIntercambio
        ? {
            hasExchange: true,
            returnedProducts: productosDevolucion.map((p) => ({
              variant_barcode: p.variant_barcode,
              product_id: p.product_id,
              variant_id: p.variant_id,
              description: p.descripcion,
              brand: p.marca,
              size_name: p.talle,
              color_name: p.color,
              color_hex: p.color_hex,
              price: p.precio,
              quantity: p.cantidad,
              size_id: p.size_id,
              color_id: p.color_id,
              sucursal_id: p.sucursal_id,
              sucursal_nombre: p.sucursal_nombre,
              group_name: p.grupo,
              tax: p.tax,
              discount: p.discount
            })),
            totalProductsValue: total,
            totalReturnedValue: totalDevolucion,
            finalAmount: totalFinal
          }
        : {
            hasExchange: false,
            returnedProducts: [],
            totalProductsValue: total,
            totalReturnedValue: 0,
            finalAmount: total
          },
      total: totalFinal // El total que se paga es la diferencia
    }))

    setLocation('/formaPago')
  }

  const total = productos.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0)
  const totalDevolucion = productosDevolucion.reduce(
    (acc, prod) => acc + prod.precio * prod.cantidad,
    0
  )
  const totalFinal = total - totalDevolucion

  return (
    <div>
      <MenuVertical currentPath="/ventas" />
      <Navbar />
      <div className="wl-20">
        <button className="btn btn-circle" onClick={() => setLocation('/home')}>
          <ArrowLeft />
        </button>

        <div className="mr-3 ml-20 flex-1">
          <h2 className="text-warning mb-6 text-2xl font-bold">Venta</h2>

          <div className="card bg-base-200 p-5 shadow-xl">
            <div className="card-body pt-0.5">
              <p>Ingrese o escanee el código de barras de variante:</p>
              <div className="flex flex-row items-center gap-6">
                <input
                  type="text"
                  placeholder="VAR-123-456-789..."
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  className="input input-bordered input-accent w-full max-w-xs"
                  onKeyDown={(e) => e.key === 'Enter' && agregarProducto()}
                  disabled={loading}
                />
                <button
                  className={`btn btn-accent ${loading ? 'loading' : ''}`}
                  onClick={agregarProducto}
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Aceptar'}
                </button>
                <button
                  className={`btn btn-error ${!productoSeleccionado ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => document.getElementById('eliminarProducto').showModal()}
                >
                  <Trash2 />
                </button>
                <button
                  className={`btn btn-warning ${!productoSeleccionado ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={addToGifts}
                  title="Agregar a regalos"
                >
                  <Gift />
                  Regalo
                </button>
                <button
                  className={`btn btn-info ${productos.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={toggleModoIntercambio}
                  title="Activar modo intercambio"
                >
                  <Replace />
                  {modoIntercambio ? 'Cancelar Intercambio' : 'Intercambio'}
                </button>
                {/* Modal eliminar producto seleccionado */}
                <dialog id="eliminarProducto" className="modal">
                  <div className="modal-box">
                    <h3 className="text-lg font-bold">Eliminar producto</h3>
                    {productoSeleccionado && (
                      <div>
                        <p>{productoSeleccionado.descripcion}</p>
                        <p>Cantidad: {productoSeleccionado.cantidad}</p>
                        {productoSeleccionado.cantidad > 1 && (
                          <div className="mt-4">
                            <label htmlFor="cantidadInput">Ingresa la cantidad a eliminar:</label>
                            <input
                              type="number"
                              id="cantidadInput"
                              className="input ml-2 w-20"
                              min="1"
                              max={productoSeleccionado.cantidad}
                              value={cantidadAEliminar}
                              onChange={(e) => {
                                setCantidadAEliminar(Number(e.target.value))
                                document.getElementById('eliminarTodosCheckbox').checked = false
                              }}
                            />
                            <label className="ml-4 flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                id="eliminarTodosCheckbox"
                                className="checkbox checkbox-warning"
                                defaultChecked={true}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCantidadAEliminar(productoSeleccionado.cantidad)
                                  }
                                }}
                              />
                              <span className="ml-2">Eliminar todos</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="modal-action">
                      <form method="dialog">
                        <div className="flex space-x-4">
                          <button
                            className="btn btn-neutral"
                            onClick={() => document.getElementById('eliminarProducto').close()}
                          >
                            Cancelar
                          </button>
                          <button className="btn btn-primary" onClick={eliminarProducto}>
                            Aceptar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </dialog>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código Variante</th>
                      <th>Descripción</th>
                      <th>Talle</th>
                      <th>Color</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Grupo</th>
                      <th>Marca</th>
                      <th>Stock Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr
                        key={producto.variant_barcode}
                        className={
                          productoSeleccionado?.variant_barcode === producto.variant_barcode
                            ? 'bg-secondary/20 cursor-pointer rounded-3xl'
                            : 'cursor-pointer'
                        }
                        onClick={() => setProductoSeleccionado(producto)}
                      >
                        <td className="font-mono text-xs">{producto.variant_barcode}</td>
                        <td>{producto.descripcion}</td>
                        <td>
                          <span className="badge badge-info">{producto.talle}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: producto.color_hex }}
                              title={producto.color}
                            ></div>
                            <span>{producto.color}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{producto.cantidad}</span>
                        </td>
                        <td>${producto.precio.toLocaleString()}</td>
                        <td>{producto.grupo}</td>
                        <td>{producto.marca}</td>
                        <td>
                          <span
                            className={`badge ${producto.stock_disponible > producto.cantidad ? 'badge-success' : 'badge-warning'}`}
                          >
                            {producto.stock_disponible}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Gifts Table */}
          {saleData.gifts && saleData.gifts.length > 0 && (
            <div className="card bg-base-300 mt-6 p-5 shadow-xl">
              <div className="card-body pt-0.5">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-orange-500">
                  <Gift className="h-5 w-5" />
                  Productos de Regalo
                </h3>
                <div className="overflow-x-auto">
                  <table className="table-compact table">
                    <thead>
                      <tr>
                        <th>Código Variante</th>
                        <th>Producto</th>
                        <th>Talle</th>
                        <th>Color</th>
                        <th>Cantidad</th>
                        <th>Marca</th>
                        <th>Disponible</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.gifts.map((gift) => {
                        // Find the corresponding product in the main products list
                        const mainProduct = productos.find(
                          (p) => p.variant_barcode === gift.variant_barcode
                        )
                        const availableForGifts = mainProduct ? mainProduct.cantidad : 0

                        return (
                          <tr key={gift.variant_barcode}>
                            <td className="font-mono text-xs">{gift.variant_barcode}</td>
                            <td>{gift.product_name}</td>
                            <td>
                              <span className="badge badge-ghost">{gift.size_name}</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-4 w-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: gift.color_hex }}
                                  title={gift.color_name}
                                ></div>
                                <span>{gift.color_name}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  className="btn btn-xs btn-circle btn-ghost"
                                  onClick={() => {
                                    const result = updateGiftQuantity(
                                      gift.variant_barcode,
                                      gift.quantity - 1,
                                      productos
                                    )
                                    if (!result.success) {
                                      toast.error(result.message, { duration: 2000 })
                                    }
                                  }}
                                >
                                  -
                                </button>
                                <span className="badge badge-warning">{gift.quantity}</span>
                                <button
                                  className="btn btn-xs btn-circle btn-ghost"
                                  onClick={() => {
                                    const result = updateGiftQuantity(
                                      gift.variant_barcode,
                                      gift.quantity + 1,
                                      productos
                                    )
                                    if (!result.success) {
                                      toast.error(result.message, { duration: 2000 })
                                    }
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>{gift.brand}</td>
                            <td>
                              <span
                                className={`badge ${gift.quantity >= availableForGifts ? 'badge-warning' : 'badge-success'}`}
                              >
                                {availableForGifts}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-xs btn-error"
                                onClick={() => removeFromGifts(gift.variant_barcode)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sección de Intercambio */}
          {modoIntercambio && (
            <div className="card bg-base-300 mt-6 p-5 shadow-xl">
              <div className="card-body pt-0.5">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-500">
                  <Replace className="h-5 w-5" />
                  Productos a Devolver (Intercambio)
                </h3>
                <div className="mb-4">
                  <p>Escanee o ingrese los productos que el cliente devuelve:</p>
                  <div className="mt-2 flex flex-row items-center gap-4">
                    <input
                      type="text"
                      placeholder="VAR-123-456-789..."
                      value={codigoDevolucionInput}
                      onChange={(e) => setCodigoDevolucionInput(e.target.value)}
                      className="input input-bordered input-warning w-full max-w-xs"
                      onKeyDown={(e) => e.key === 'Enter' && agregarProductoDevolucion()}
                      disabled={loadingDevolucion}
                    />
                    <button
                      className={`btn btn-warning ${loadingDevolucion ? 'loading' : ''}`}
                      onClick={agregarProductoDevolucion}
                      disabled={loadingDevolucion}
                    >
                      {loadingDevolucion ? 'Buscando...' : 'Agregar Devolución'}
                    </button>
                  </div>
                </div>

                {productosDevolucion.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Código Variante</th>
                          <th>Descripción</th>
                          <th>Talle</th>
                          <th>Color</th>
                          <th>Cantidad</th>
                          <th>Precio unitario</th>
                          <th>Marca</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosDevolucion.map((producto) => (
                          <tr key={producto.variant_barcode}>
                            <td className="font-mono text-xs">{producto.variant_barcode}</td>
                            <td>{producto.descripcion}</td>
                            <td>
                              <span className="badge badge-warning">{producto.talle}</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-4 w-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: producto.color_hex }}
                                  title={producto.color}
                                ></div>
                                <span>{producto.color}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  className="btn btn-xs btn-circle btn-ghost"
                                  onClick={() => {
                                    if (producto.cantidad > 1) {
                                      const nuevosProductos = productosDevolucion.map((p) =>
                                        p.variant_barcode === producto.variant_barcode
                                          ? { ...p, cantidad: p.cantidad - 1 }
                                          : p
                                      )
                                      setProductosDevolucion(nuevosProductos)
                                    }
                                  }}
                                  disabled={producto.cantidad <= 1}
                                >
                                  -
                                </button>
                                <span className="badge badge-error">{producto.cantidad}</span>
                                <button
                                  className="btn btn-xs btn-circle btn-ghost"
                                  onClick={() => {
                                    const nuevosProductos = productosDevolucion.map((p) =>
                                      p.variant_barcode === producto.variant_barcode
                                        ? { ...p, cantidad: p.cantidad + 1 }
                                        : p
                                    )
                                    setProductosDevolucion(nuevosProductos)
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>${producto.precio.toLocaleString()}</td>
                            <td>{producto.marca}</td>
                            <td>
                              <button
                                className="btn btn-xs btn-error"
                                onClick={() => eliminarProductoDevolucion(producto.variant_barcode)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-base-100 mt-4 rounded-lg p-4">
                      <p className="text-error text-lg font-semibold">
                        Total productos devueltos: ${totalDevolucion.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="bg-base-200 rounded-lg p-4">
              <p className="text-xl font-bold">
                Total productos a llevar: ${total.toLocaleString()}
              </p>
              {modoIntercambio && totalDevolucion > 0 && (
                <>
                  <p className="text-error text-lg font-semibold">
                    Total productos devueltos: -${totalDevolucion.toLocaleString()}
                  </p>
                  <hr className="my-2" />
                  <p className="text-2xl font-bold text-black">
                    Total a pagar: ${totalFinal.toLocaleString()}
                  </p>
                </>
              )}
              {!modoIntercambio && (
                <p className="text-primary text-2xl font-bold">Total: ${total.toLocaleString()}</p>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <button
                className={`flex justify-end ${productos.length > 0 ? 'btn btn-success' : 'btn btn-disabled'}`}
                onClick={handleSubmit}
              >
                Confirmar venta
              </button>
            </div>
            <Toaster position="bottom-center" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ventas
