import { ArrowLeft, CreditCard, HandCoins, Landmark, WalletCards } from 'lucide-react'
import { useLocation } from 'wouter'

export default function FormasPago() {
  const [, setLocation] = useLocation()
  return (
    <div>
      <h1>Formas de Pago</h1>
      <button onClick={() => setLocation('/ventas')}>
        <ArrowLeft />
      </button>
      <div className="tooltip" data-tip="Contado">
        <button>
          <HandCoins />
        </button>
      </div>
      <div className="tooltip" data-tip="Tranferencia">
        <button>
          <Landmark />
        </button>
      </div>
      <div className="tooltip" data-tip="Tarjeta">
        <button>
          <CreditCard />
        </button>
      </div>
      <div className="tooltip" data-tip="Cuenta Corriente">
        <button>
          <WalletCards />
        </button>
      </div>
    </div>
  )
}
