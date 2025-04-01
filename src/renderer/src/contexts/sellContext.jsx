import { createContext, useState, useContext } from 'react';

const SellContext = createContext();

export const SellProvider = ({ children }) => {
    const [saleData, setSaleData] = useState({
        products: [],
        payments: [],
        customer: null,
        total: 0,
        // otros campos que necesites
    });

    const addProduct = (product) => {
        setSaleData(prev => ({
            ...prev,
            products: [...prev.products, product],
            total: prev.total + (product.price * product.quantity)
        }));
    };

    const addPayment = (payment) => {
        setSaleData(prev => ({
            ...prev,
            payments: [...prev.payments, payment]
        }));
    };

    const resetSale = () => {
        setSaleData({
            products: [],
            payments: [],
            customer: null,
            total: 0,
        });
    };

    return (
        <SellContext.Provider
            value={{
                saleData,
                setSaleData, // Asegúrate de exponer esta función
                addProduct,
                addPayment,
                resetSale
            }}
        >
            {children}
        </SellContext.Provider>
    );
};

export const useSellContext = () => useContext(SellContext);