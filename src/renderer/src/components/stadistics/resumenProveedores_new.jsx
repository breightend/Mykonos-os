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
  Sparkles,
  Crown,
  Flame,
  Coffee,
  Watch
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchProductStatistics } from '../../services/proveedores/purchaseService'
import { useHashLocation } from 'wouter/use-hash-location'

export default function ResumenProveedores() {
  const [productStats, setProductStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [setLocation] = useHashLocation()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short'
    })
  }

  const handleVolver = () => {
    setLocation('/proveedores')
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await fetchProductStatistics()
      setProductStats(data)
    } catch (error) {
      console.error('Error fetching product statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <div className="loading loading-spinner loading-lg absolute inset-0 animate-pulse text-secondary opacity-30"></div>
          </div>
          <p className="mt-6 text-xl font-medium text-gray-600">
            Cargando estadísticas de productos...
          </p>
          <p className="mt-2 text-sm text-gray-500">Analizando tus compras por categoría</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with elegant styling */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-ghost btn-circle transition-all duration-300 hover:btn-primary hover:scale-110"
              onClick={handleVolver}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
                Estadísticas de Productos
              </h1>
              <p className="mt-1 flex items-center gap-2 text-lg text-gray-600">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Análisis detallado de tus compras por categorías
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-8">
        {/* Summary Cards with beautiful gradients and animations */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="group card relative transform overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-sm font-medium opacity-90">Productos Únicos</h3>
                  <p className="text-3xl font-bold">
                    {productStats.product_summary?.total_unique_products || 0}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3 transition-transform duration-300 group-hover:rotate-12">
                  <Package className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs opacity-90">Catálogo diverso</span>
              </div>
            </div>
          </div>

          <div className="group card relative transform overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-sm font-medium opacity-90">Categorías</h3>
                  <p className="text-3xl font-bold">
                    {productStats.product_summary?.total_groups || 0}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3 transition-transform duration-300 group-hover:rotate-12">
                  <Tag className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="text-xs opacity-90">Grupos activos</span>
              </div>
            </div>
          </div>

          <div className="group card relative transform overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-sm font-medium opacity-90">Marcas</h3>
                  <p className="text-3xl font-bold">
                    {productStats.product_summary?.total_brands || 0}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3 transition-transform duration-300 group-hover:rotate-12">
                  <Star className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="text-xs opacity-90">Partners</span>
              </div>
            </div>
          </div>

          <div className="group card relative transform overflow-hidden bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-sm font-medium opacity-90">Total Unidades</h3>
                  <p className="text-3xl font-bold">
                    {productStats.product_summary?.total_products_purchased || 0}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3 transition-transform duration-300 group-hover:rotate-12">
                  <ShoppingBag className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs opacity-90">En inventario</span>
              </div>
            </div>
          </div>

          <div className="group card relative transform overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-600 text-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-sm font-medium opacity-90">Valor Total</h3>
                  <p className="text-2xl font-bold">
                    {formatCurrency(productStats.product_summary?.total_products_value || 0)}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3 transition-transform duration-300 group-hover:rotate-12">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-xs opacity-90">Inversión total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products by Group - Main Focus with beautiful design */}
        <div className="card overflow-hidden border-0 bg-white/80 shadow-2xl backdrop-blur-md">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <Shirt className="h-10 w-10" />
              </div>
              <div>
                <h3 className="mb-2 text-3xl font-bold">Compras por Categoría</h3>
                <p className="text-xl opacity-90">¿Qué tipos de productos compras más?</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
              {productStats.products_by_group?.map((group, index) => {
                const icons = [
                  { icon: Shirt, color: 'from-blue-500 to-cyan-500' },
                  { icon: Crown, color: 'from-purple-500 to-pink-500' },
                  { icon: Coffee, color: 'from-green-500 to-emerald-500' },
                  { icon: Watch, color: 'from-orange-500 to-red-500' },
                  { icon: Flame, color: 'from-indigo-500 to-purple-500' },
                  { icon: Star, color: 'from-teal-500 to-blue-500' }
                ]
                const IconComponent = icons[index % icons.length].icon
                const gradient = icons[index % icons.length].color

                return (
                  <div
                    key={index}
                    className="group card relative transform overflow-hidden border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-500 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                    <div className="card-body relative z-10 p-6">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`bg-gradient-to-r p-3 ${gradient} rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                          >
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-800 transition-colors group-hover:text-blue-600">
                            {group.group_name}
                          </h4>
                        </div>
                        <div
                          className={`badge badge-lg bg-gradient-to-r ${gradient} border-0 px-4 py-2 font-bold text-white shadow-lg`}
                        >
                          {group.total_quantity}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 transition-shadow group-hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-700">Cantidad Total</span>
                          </div>
                          <span className="text-2xl font-bold text-blue-900">
                            {group.total_quantity}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4 transition-shadow group-hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-700">Productos Únicos</span>
                          </div>
                          <span className="text-xl font-bold text-green-900">
                            {group.unique_products}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4 transition-shadow group-hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-purple-700">Órdenes de Compra</span>
                          </div>
                          <span className="text-xl font-bold text-purple-900">
                            {group.purchase_count}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition-shadow group-hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-amber-600" />
                            <span className="font-medium text-amber-700">Total Gastado</span>
                          </div>
                          <span className="text-xl font-bold text-amber-900">
                            {formatCurrency(group.total_spent)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <span className="font-medium text-gray-600">Precio promedio:</span>
                          <span className="text-lg font-bold text-gray-800">
                            {formatCurrency(group.avg_cost_price || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Products with enhanced design */}
        <div className="card overflow-hidden border-0 bg-white/80 shadow-2xl backdrop-blur-md">
          <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <TrendingUp className="h-10 w-10" />
              </div>
              <div>
                <h3 className="mb-2 text-3xl font-bold">Top 10 Productos Más Comprados</h3>
                <p className="text-xl opacity-90">Tus productos favoritos</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-4 text-left font-bold text-gray-700">#</th>
                    <th className="py-4 text-left font-bold text-gray-700">Producto</th>
                    <th className="py-4 text-left font-bold text-gray-700">Categoría</th>
                    <th className="py-4 text-left font-bold text-gray-700">Cantidad Total</th>
                    <th className="py-4 text-left font-bold text-gray-700">Frecuencia</th>
                    <th className="py-4 text-left font-bold text-gray-700">Total Gastado</th>
                    <th className="py-4 text-left font-bold text-gray-700">Precio Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.top_products?.map((product, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    >
                      <td className="py-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-white">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-gray-800">{product.product_name}</td>
                      <td className="py-4">
                        <span className="badge badge-outline badge-lg">{product.group_name}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xl font-bold text-blue-600">
                          {product.total_quantity}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-lg font-medium text-purple-600">
                          {product.purchase_frequency}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(product.total_spent)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-lg font-medium text-orange-600">
                          {formatCurrency(product.avg_cost_price)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Brands by Group with beautiful cards */}
        <div className="card overflow-hidden border-0 bg-white/80 shadow-2xl backdrop-blur-md">
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <Award className="h-10 w-10" />
              </div>
              <div>
                <h3 className="mb-2 text-3xl font-bold">Marcas por Categoría</h3>
                <p className="text-xl opacity-90">Tus marcas favoritas en cada grupo</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
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
                .map((group, index) => {
                  const gradients = [
                    'from-blue-500 to-cyan-500',
                    'from-purple-500 to-pink-500',
                    'from-green-500 to-emerald-500',
                    'from-orange-500 to-red-500',
                    'from-indigo-500 to-purple-500',
                    'from-teal-500 to-blue-500'
                  ]
                  const gradient = gradients[index % gradients.length]

                  return (
                    <div
                      key={index}
                      className="card border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="card-body p-6">
                        <div
                          className={`mb-6 flex items-center gap-3 bg-gradient-to-r p-4 ${gradient} rounded-xl text-white`}
                        >
                          <Crown className="h-6 w-6" />
                          <h4 className="text-xl font-bold">{group.group_name}</h4>
                        </div>
                        <div className="space-y-3">
                          {group.brands.map((brand, brandIndex) => (
                            <div
                              key={brandIndex}
                              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 transition-shadow hover:shadow-md"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-3 w-3 rounded-full bg-gradient-to-r ${gradient}`}
                                ></div>
                                <span className="font-semibold text-gray-800">
                                  {brand.brand_name}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {brand.total_quantity} uds
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatCurrency(brand.total_spent)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Monthly trends if available */}
        {productStats.monthly_by_group && productStats.monthly_by_group.length > 0 && (
          <div className="card overflow-hidden border-0 bg-white/80 shadow-2xl backdrop-blur-md">
            <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 p-8 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                  <Calendar className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="mb-2 text-3xl font-bold">Tendencias Mensuales</h3>
                  <p className="text-xl opacity-90">Evolución de compras por categoría</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {productStats.monthly_by_group?.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-gray-800">{item.group_name}</h5>
                        <p className="text-sm text-gray-600">{formatDate(item.month)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{item.quantity} uds</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.total_spent)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
