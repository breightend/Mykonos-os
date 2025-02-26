import { DollarSign, Package } from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'

export default function Home() {
  return (
    <>
      {/* Menú lateral */}
      <MenuVertical currentPath="/home" />
      <div className={`transition-all duration-300 ease-in-out`}>
        <div className="flex-1 ml-20">
          <div className="navbar bg-base-100">
            <div className="flex-1">
              <a className="btn btn-ghost text-xl">Mykonos OS HOME</a>
            </div>
          </div>
          {/* Aca resto del contenido*/}
          <div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <DollarSign />
                </div>
                <div className="stat-title">Total vendido</div>
                <div className="stat-value">1200000</div>
                <div className="stat-desc">Jan 1st - Feb 1st</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Package />
                </div>
                <div className="stat-title">Cantidad de productos</div>
                <div className="stat-value">40</div>
                <div className="stat-desc">↗︎ 400 (22%)</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block h-8 w-8 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    ></path>
                  </svg>
                </div>
                <div className="stat-title">New Registers</div>
                <div className="stat-value">1,200</div>
                <div className="stat-desc">↘︎ 90 (14%)</div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Venta</th>
                  <th>Cantidad de productos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* row 1 */}
                <tr>
                  <th>1</th>
                  <td>Cy Ganderton</td>
                  <td>Quality Control Specialist</td>
                  <td>Blue</td>
                </tr>
                {/* row 2 */}
                <tr>
                  <th>2</th>
                  <td>Hart Hagerty</td>
                  <td>Desktop Support Technician</td>
                  <td>Purple</td>
                </tr>
                {/* row 3 */}
                <tr>
                  <th>3</th>
                  <td>Brice Swyre</td>
                  <td>Tax Accountant</td>
                  <td>Red</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
