import { fetchBrand, postDataBrand } from '../services/proveedores/brandService'
import { useEffect, useState } from 'react'
export default function Brand(id_Provider) {
  const [brand, setBrand] = useState([])
  const [formData, setFormData] = useState({
    brand_name: '',
    description: '',
    creationData: '',
    last_modified_data: ''
  })

  useEffect(
    const async () => {
        
        try {
            const responseBrand = await fetchBrand,
        }
    }
  )
  return (
    <>
      <hr className="mt-4 border-2" />
      <h1 className="text-3xl font-bold">Marcas: </h1>
      <hr className="mt-4 border-2" />
    </>
  )
}
