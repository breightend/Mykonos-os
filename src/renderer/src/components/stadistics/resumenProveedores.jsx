import {
  ArrowLeft,
  Package,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  Tag,
  Star,
  Calendar,
  DollarSign,
  Shirt,
  Award,
  Activity,
  Zap,
  Target,
  Sparkles
} from 'lucide-react'
import { useLocation } from 'wouter'
import { useEffect, useState } from 'react'
import { fetchProductStatistics } from '../../services/proveedores/purchaseService'

export default function ResumenProveedores() {
  const [, setLocation] = useLocation()
  const [productStats, setProductStats] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const statsData = await fetchProductStatistics()
      setProductStats(statsData)
    } catch (error) {
      console.error('Error fetching product statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => setLocation('/proveedores')} className="btn btn-ghost">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">Estadísticas de Productos Comprados</h1>
      </div>

      {/* Product Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="stat rounded-box bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="stat-figure text-blue-200">
            <Package className="h-8 w-8" />
          </div>
          <div className="stat-title text-blue-100">Productos Únicos</div>
          <div className="stat-value">
            {productStats.product_summary?.total_unique_products || 0}
          </div>
          <div className="stat-desc text-blue-200">Diferentes productos comprados</div>
        </div>

        <div className="stat rounded-box bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="stat-figure text-green-200">
            <Tag className="h-8 w-8" />
          </div>
          <div className="stat-title text-green-100">Grupos de Productos</div>
          <div className="stat-value">{productStats.product_summary?.total_groups || 0}</div>
          <div className="stat-desc text-green-200">Categorías (Pantalones, Remeras, etc.)</div>
        </div>

        <div className="stat rounded-box bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="stat-figure text-purple-200">
            <Star className="h-8 w-8" />
          </div>
          <div className="stat-title text-purple-100">Marcas</div>
          <div className="stat-value">{productStats.product_summary?.total_brands || 0}</div>
          <div className="stat-desc text-purple-200">Marcas diferentes</div>
        </div>

        <div className="stat rounded-box bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="stat-figure text-orange-200">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="stat-title text-orange-100">Total Unidades</div>
          <div className="stat-value">
            {productStats.product_summary?.total_products_purchased || 0}
          </div>
          <div className="stat-desc text-orange-200">Unidades compradas en total</div>
        </div>

        <div className="stat rounded-box bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="stat-figure text-red-200">
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="stat-title text-red-100">Valor Total</div>
          <div className="stat-value text-lg">
            {formatCurrency(productStats.product_summary?.total_products_value || 0)}
          </div>
          <div className="stat-desc text-red-200">Dinero invertido en productos</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Products by Group - Main Focus */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 text-2xl">
                <Package className="h-8 w-8 text-primary" />
                ¿Cuántos productos compraste por categoría?
              </h2>
              <p className="mb-4 text-gray-600">
                Aquí puedes ver cuántos pantalones, remeras, zapatos, etc. has comprado
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {productStats.products_by_group?.map((group, index) => (
                  <div
                    key={index}
                    className="card border bg-gradient-to-br from-base-100 to-base-200 shadow-lg"
                  >
                    <div className="card-body">
                      <h3 className="card-title flex items-center justify-between text-lg text-primary">
                        {group.group_name}
                        <div className="badge badge-primary badge-lg">{group.total_quantity}</div>
                      </h3>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Unidades totales:</span>
                          <span className="text-lg font-bold text-primary">
                            {group.total_quantity}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Productos diferentes:</span>
                          <span className="font-semibold">{group.unique_products}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Compras realizadas:</span>
                          <span className="font-semibold">{group.purchase_count}</span>
                        </div>

                        <div className="divider my-2"></div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total gastado:</span>
                          <span className="font-bold text-success">
                            {formatCurrency(group.total_spent)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Precio promedio:</span>
                          <span className="text-sm">
                            {formatCurrency(group.avg_cost_price || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions mt-4 justify-end">
                        <div className="badge badge-outline">
                          ${(group.total_spent / group.total_quantity || 0).toFixed(0)} por unidad
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-secondary" />
                Top 10 Productos Más Comprados
              </h2>
              <p className="mb-4 text-gray-600">Los productos individuales que más has comprado</p>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Posición</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Cantidad Total</th>
                      <th>Veces Comprado</th>
                      <th>Total Invertido</th>
                      <th>Precio Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productStats.top_products?.map((product, index) => (
                      <tr key={index} className={index < 3 ? 'bg-warning/10' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                            <span className="font-bold">#{index + 1}</span>
                          </div>
                        </td>
                        <td className="font-medium">{product.product_name}</td>
                        <td>
                          <span className="badge badge-outline badge-primary">
                            {product.group_name}
                          </span>
                        </td>
                        <td>
                          <span className="text-lg font-bold">{product.total_quantity}</span>
                        </td>
                        <td>{product.purchase_frequency} veces</td>
                        <td className="font-semibold text-success">
                          {formatCurrency(product.total_spent)}
                        </td>
                        <td>{formatCurrency(product.avg_cost_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Brands by Group */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-accent" />
                Marcas por Categoría de Producto
              </h2>
              <p className="mb-4 text-gray-600">Qué marcas compras más en cada categoría</p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {productStats.brands_by_group
                  ?.reduce((acc, brand) => {
                    const existingGroup = acc.find((g) => g.group_name === brand.group_name)
                    if (existingGroup) {
                      existingGroup.brands.push(brand)
                    } else {
                      acc.push({
                        group_name: brand.group_name,
                        brands: [brand]
                      })
                    }
                    return acc
                  }, [])
                  .map((group, index) => (
                    <div key={index} className="card border bg-base-100 shadow">
                      <div className="card-body p-4">
                        <h3 className="mb-3 text-lg font-bold text-primary">{group.group_name}</h3>
                        <div className="space-y-3">
                          {group.brands.slice(0, 5).map((brand, brandIndex) => (
                            <div
                              key={brandIndex}
                              className="flex items-center justify-between rounded bg-base-200 p-2"
                            >
                              <div>
                                <div className="font-medium">{brand.brand_name}</div>
                                <div className="text-xs text-gray-500">
                                  {brand.unique_products} productos diferentes
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{brand.total_quantity} uds</div>
                                <div className="text-xs text-success">
                                  {formatCurrency(brand.total_spent)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {group.brands.length > 5 && (
                            <div className="text-center text-sm text-gray-500">
                              +{group.brands.length - 5} marcas más
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        {productStats.monthly_by_group && productStats.monthly_by_group.length > 0 && (
          <div className="lg:col-span-2">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-info" />
                  Tendencia de Compras por Mes (Últimos 6 meses)
                </h2>
                <p className="mb-4 text-gray-600">
                  Evolución de tus compras por categoría mes a mes
                </p>

                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th>Categoría</th>
                        <th>Cantidad</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStats.monthly_by_group.map((item, index) => (
                        <tr key={index}>
                          <td className="font-medium">{item.month}</td>
                          <td>
                            <span className="badge badge-outline">{item.group_name}</span>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.total_spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
