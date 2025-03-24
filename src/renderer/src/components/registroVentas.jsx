import { Archive, DollarSign, Package } from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { Search } from 'lucide-react'
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from 'react-day-picker/locale';
export default function Home() {
  const [date, setDate] = useState(new Date());

  return (
    <>
      {/* Menú lateral */}
      <MenuVertical currentPath="/home" />
      <Navbar />
      <div className={`transition-all duration-300 ease-in-out`}>
        <div className="flex-1 ml-20">
          {/* Aca resto del contenido*/}
          <div className='flex justify-end mr-4'>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <DollarSign />
                </div>
                <div className="stat-title">Total vendido</div>
                <div className="stat-value">1200000</div>
                <div className="stat-desc">{new Date().toLocaleDateString()}</div>
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
                  <Archive />
                </div>
                <div className="stat-title">New Registers</div>
                <div className="stat-value">1,200</div>
                <div className="stat-desc">↘︎ 90 (14%)</div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-6 mt-4 text-warning">Registro de ventas</h2>
          <div className='flex auto-cols-fr gap-4'>
            <label className="input input-bordered flex items-center gap-2 input-warning">
              <input
                type="text"
                placeholder="Buscar..."
                className="grow"
              />
              <Search className="w-4 h-4" />
            </label>
            {/* calendario de seleccionar fecha:  */}
            <button popoverTarget="rdp-popover" className="input input-border" style={{ anchorName: "--rdp" }}>
              {date ? date.toLocaleDateString() : "Pick a date"}
            </button>
            <div popover="auto" id="rdp-popover" className="dropdown" style={{ positionAnchor: "--rdp" }}>
              <DayPicker className="react-day-picker" mode="single" selected={date} onSelect={setDate} locale={es} />
            </div>
            <button className="btn btn-primary">Filtrar</button>
          </div>

          <div className="overflow-x-auto mt-4  bg-base-100 shadow-2xs" >
            <table className="table">
              {/* head */}
              <thead className='bg-accent/30'>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Detalle</th>
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
