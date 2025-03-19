import { ArrowLeft, CreditCard, HandCoins, Landmark, WalletCards } from 'lucide-react'
import { useLocation } from 'wouter'

export default function FormasPago() {
  const [, setLocation] = useLocation()
  return (
    <div>
      <div className="flex mt-4 gap-2">
        <button type="button" className="btn btn-icon " onClick={() => setLocation('/ventas')}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold text-3xl">Formas de Pago</h1>
      </div>
      <div className="flex justify-center mt-10 items-center">
        <div className="tooltip" data-tip="Contado">
          <button type="button" className="btn btn-icon p-10">
            <HandCoins />
          </button>
        </div>
        <div className="tooltip" data-tip="Tranferencia">
          <button type="button" className="btn btn-icon p-10">
            <Landmark />
          </button>
        </div>
        <div className="tooltip" data-tip="Tarjeta">
          <button type="button" className="btn btn-icon p-10">
            <CreditCard />
          </button>
        </div>
        <div className="tooltip" data-tip="Cuenta Corriente">
          <button type="button" className="btn btn-icon p-10">
            <WalletCards />
          </button>
        </div>
        <div className='flex'>
          <button type="submit" className="btn btn-success" onClick={()=> setLocation("")}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
