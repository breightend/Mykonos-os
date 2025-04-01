import  { createContext, useContext, useState, useEffect } from "react";

const sellContext = createContext();
//TODO: ver el tema de colocar vendedor
export const SellProvider = ({ children }) => {
    const [sell, setSell] = useState('')
    const [products, setProducts] = useState([])
    const [formaPago, setFormaPago] = useState('')
    const [total, setTotal] = useState(0)
    const [cliente, setCliente] = useState('')
    const [vendedor, setVendedor] = useState('')