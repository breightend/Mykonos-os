export default function CreateSucursal() {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  return (
    <div>
      <h2>Crear Sucursal</h2>
      <form>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input type="text" id="nombre" name="nombre" required />
        </div>
        <div>
          <label htmlFor="direccion">Dirección:</label>
          <input type="text" id="direccion" name="direccion" required />
        </div>
        <button type="submit">Crear Sucursal</button>
      </form>
    </div>
  )
}
