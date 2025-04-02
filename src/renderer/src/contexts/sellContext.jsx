import { createContext, useState, useContext } from 'react';

const SellContext = createContext();

export const SellProvider = ({ children }) => {
    const [saleData, setSaleData] = useState({
        products: [],
        payments: [],
        customer: null,
        total: 0,
        discount: 0,
    });

    // Métodos para productos (se mantienen igual)
    const addProduct = (product) => {
        setSaleData(prev => ({
            ...prev,
            products: [...prev.products, product],
            total: prev.total + (product.price * product.quantity)
        }));
    };

    // Método mejorado para pagos
    const addPaymentMethod = (method) => {
        setSaleData(prev => {
            // Verificar si el método ya existe
            const existingIndex = prev.paymentMethods.findIndex(m => m.id === method.id);

            let updatedMethods;
            if (existingIndex >= 0) {
                // Actualizar método existente
                updatedMethods = [...prev.paymentMethods];
                updatedMethods[existingIndex] = method;
            } else {
                // Agregar nuevo método
                updatedMethods = [...prev.paymentMethods, method];
            }

            // Calcular nuevo total pagado
            const totalPaid = updatedMethods.reduce((sum, m) => sum + m.amount, 0);

            return {
                ...prev,
                paymentMethods: updatedMethods,
                payments: updatedMethods, // Mantener compatibilidad
                discount: prev.total - totalPaid
            };
        });
    };

    // Método para establecer múltiples métodos de pago a la vez
    const setPaymentMethods = (methods) => {
        const totalPaid = methods.reduce((sum, m) => sum + m.amount, 0);

        setSaleData(prev => ({
            ...prev,
            paymentMethods: methods,
            payments: methods, // Mantener compatibilidad
            discount: prev.total - totalPaid
        }));
    };

    // Mantener métodos existentes para compatibilidad
    const addPayment = (payment) => {
        addPaymentMethod({
            id: payment.method,
            type: payment.method,
            amount: payment.amount,

        });
    };

    const resetSale = () => {
        setSaleData({
            products: [],
            payments: [],
            customer: 0, //Aca me gustaria que me pase el dni 
            total: 0,
        });
    };

    return (
        <SellContext.Provider
            value={{
                saleData,
                setSaleData,
                addProduct,
                addPayment,
                addPaymentMethod, // Nuevo método
                setPaymentMethods, // Nuevo método
                resetSale
            }}
        >
            {children}
        </SellContext.Provider>
    );
};

export const useSellContext = () => useContext(SellContext);