import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, ShoppingCart, FileUp, FileCheck2, CreditCard } from 'lucide-react';
import { fetchProductos } from '../../services/products/productService';
import { createPurchase } from '../../services/proveedores/purchaseService';
import toast from 'react-hot-toast';
import { getBancos } from '../../services/paymentsServices/banksService';
import paymentMethodsService from '../../services/paymentsServices/paymentMethodsService';
import { useLocation, useSearchParams } from 'wouter';

export default function AgregarCompraProveedor({ provider }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('id');

  const [purchaseData, setPurchaseData] = useState({
    subtotal: 0,
    discount: 0,
    total: 0,
    payment_method: '',
    transaction_number: '',
    invoice_number: '',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    bank_id: '',
  });

  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    product_id: '',
    cost_price: '',
    quantity: 1,
    discount: 0,
  });

  const [banks, setBanks] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoiceFile, setInvoiceFile] = useState(null);

  // Load necessary data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const methods = await paymentMethodsService.getAllPaymentMethods();
        setPaymentMethods(methods.payment_methods || []);
        const bancosData = await getBancos();
        setBanks(bancosData.banks || []);
        const productsData = await fetchProductos();
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar datos');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const subtotal = purchaseProducts.reduce(
      (acc, item) => acc + (item.cost_price * item.quantity - item.discount),
      0,
    );
    const total = subtotal - purchaseData.discount;

    setPurchaseData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    }));
  }, [purchaseProducts, purchaseData.discount]);

  const handlePurchaseInputChange = (e) => {
    const { name, value } = e.target;
    setPurchaseData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };




  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!provider?.id) {
      toast.error('No se ha seleccionado un proveedor');
      return;
    }
    if (purchaseProducts.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    try {
      setLoading(true);
      const purchasePayload = {
        entity_id: provider.id,
        subtotal: parseFloat(purchaseData.subtotal),
        discount: parseFloat(purchaseData.discount) || 0,
        total: parseFloat(purchaseData.total),
        payment_method: purchaseData.payment_method,
        transaction_number: purchaseData.transaction_number,
        invoice_number: purchaseData.invoice_number,
        notes: purchaseData.notes,
        status: 'Pendiente de entrega',
        products: purchaseProducts.map((product) => ({
          product_id: product.product_id,
          cost_price: product.cost_price,
          quantity: product.quantity,
          discount: product.discount,
          subtotal: product.subtotal,
        })),
        invoice_file: invoiceFile,
      };

      const result = await createPurchase(purchasePayload);

      if (result.status === 'éxito') {
        toast.success('Compra creada exitosamente');
        // Redirect or reset the form
        setLocation(`/infoProvider?id=${providerId}`);
        resetForm();
      } else {
        toast.error('Error al crear la compra');
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Error al crear la compra');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPurchaseData({
      subtotal: 0,
      discount: 0,
      total: 0,
      payment_method: '',
      transaction_number: '',
      invoice_number: '',
      notes: '',
    });
    setPurchaseProducts([]);
    setInvoiceFile(null);
    setPaymentData({ bank_id: '' });
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setInvoiceFile(uploadedFile);
    } else {
      setInvoiceFile(null);
      alert('Por favor, sube un archivo PDF.');
    }
  };

  const handleRemoveFile = () => {
    setInvoiceFile(null);
  };

  const isBankFieldVisible = ['2', '3', '4', '5'].includes(purchaseData.payment_method);

  const handleCerrar= () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductFormData({
      product_id: '',
      cost_price: '',
      quantity: 1,
      discount: 0,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-8 rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-4 border-b pb-4">
          <ShoppingCart className="h-10 w-10 text-primary" />
          <h2 className="text-3xl font-extrabold text-gray-800">
            Nueva Compra - {provider?.entity_name || 'Proveedor'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Purchase Information Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-700">
              <CreditCard className="h-5 w-5 text-secondary" />
              Detalles de la Compra
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Método de Pago *</span>
                </label>
                <select
                  name="payment_method"
                  value={purchaseData.payment_method}
                  onChange={handlePurchaseInputChange}
                  className="select-bordered select w-full"
                  required
                >
                  <option value="">Seleccionar método...</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {isBankFieldVisible && (
                <div>
                  <label htmlFor="" className="label">
                    <span className="label-text font-medium text-gray-600">Banco *</span>
                  </label>
                  <select
                    name="bank_id"
                    value={paymentData.bank_id}
                    onChange={handlePaymentInputChange}
                    className="select-bordered select w-full"
                    required
                  >
                    <option value="">Seleccionar banco...</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">
                    Número de Transacción
                  </span>
                </label>
                <input
                  type="text"
                  name="transaction_number"
                  value={purchaseData.transaction_number}
                  onChange={handlePurchaseInputChange}
                  className="input-bordered input w-full"
                  placeholder="Número de comprobante"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Número de Factura</span>
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={purchaseData.invoice_number}
                  onChange={handlePurchaseInputChange}
                  className="input-bordered input w-full"
                  placeholder="Número de factura"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Notas</span>
                </label>
                <textarea
                  name="notes"
                  value={purchaseData.notes}
                  onChange={handlePurchaseInputChange}
                  className="textarea-bordered textarea w-full"
                  placeholder="Notas adicionales sobre la compra"
                  rows="2"
                />
              </div>
            </div>
          </section>

          {/* Invoice Upload Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-700">
              <FileUp className="h-5 w-5 text-secondary" />
              Factura de Compra
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Sube el archivo PDF de la factura para mantener un registro digital.
            </p>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="invoice-upload"
                className="btn btn-primary btn-outline cursor-pointer transition-colors duration-200 hover:bg-primary hover:text-white"
              >
                {invoiceFile ? (
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5" />
                    <span>Cambiar Archivo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileUp className="h-5 w-5" />
                    <span>Seleccionar Archivo</span>
                  </div>
                )}
                <input
                  id="invoice-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {invoiceFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="truncate font-medium">{invoiceFile.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-error hover:text-red-700"
                    aria-label="Eliminar archivo"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Products Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-700">
                <Package className="h-5 w-5 text-secondary" />
                Productos de la Compra
              </h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setLocation(`/agregarProductoCompraProveedor?id=${providerId}`)}
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>

            {purchaseProducts.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="table w-full">
                  <thead className="bg-gray-200 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Precio Costo</th>
                      <th className="px-4 py-3 text-left">Cantidad</th>
                      <th className="px-4 py-3 text-left">Descuento</th>
                      <th className="px-4 py-3 text-left">Subtotal</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseProducts.map((product) => (
                      <tr key={product.id} className="border-b transition-colors hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium">{product.product_name}</td>
                        <td className="px-4 py-3">{product.barcode}</td>
                        <td className="px-4 py-3 text-gray-600">
                          ${product.cost_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{product.quantity}</td>
                        <td className="px-4 py-3 text-gray-600">${product.discount.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-success">
                          ${product.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                          
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <p>No hay productos agregados a la compra.</p>
                <p className="text-sm">Usa el botón Agregar Producto para empezar.</p>
              </div>
            )}
          </section>

          {/* Totals Section */}
          <section className="flex flex-col gap-4 rounded-lg bg-gray-50 p-6 shadow-sm md:flex-row md:justify-end">
            <div className="flex flex-col items-center md:w-1/3 md:items-end">
              <label className="label">
                <span className="label-text font-medium text-gray-600">Subtotal</span>
              </label>
              <input
                type="text"
                value={`$${purchaseData.subtotal}`}
                className="input-bordered input w-full text-right font-mono text-lg"
                readOnly
              />
            </div>

            <div className="flex flex-col items-center md:w-1/3 md:items-end">
              <label className="label">
                <span className="label-text font-medium text-gray-600">Descuento Global</span>
              </label>
              <input
                type="number"
                name="discount"
                value={purchaseData.discount}
                onChange={handlePurchaseInputChange}
                className="input-bordered input w-full text-right font-mono text-lg"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex flex-col items-center md:w-1/3 md:items-end">
              <label className="label">
                <span className="label-text font-bold text-gray-800">TOTAL</span>
              </label>
              <input
                type="text"
                value={`$${purchaseData.total}`}
                className="input-bordered input w-full bg-primary text-right text-xl font-extrabold text-white"
                readOnly
              />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="btn btn-ghost text-gray-600 hover:bg-gray-200"
              onClick={handleCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || purchaseProducts.length === 0}
            >
              {loading ? 'Creando...' : 'Crear Compra'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}