import { useLocation } from 'wouter'

export default function ConfirmacionDatosDeCompra() {
  const [, setLocation] = useLocation()
 
  return (
    <div>
      <h1 className="text-3xl font-bold">Datos de la compra</h1>
      <div>
        <button className="btn" onClick={() => setLocation('/confirmacionDatosDeCompra')}>
          Cancelar
        </button>
        <button className="btn btn-success">Aceptar</button>
      </div>
    </div>
  )
}
