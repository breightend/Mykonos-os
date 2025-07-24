import { Cog, Moon, SunMedium, Calculator, Percent, DollarSign } from 'lucide-react'
import { useTheme } from '../contexts/themeContext'
import { useLocation } from 'wouter'
import { useSettings } from '../contexts/settingsContext'
import { useRef, useState, useEffect } from 'react'

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { settings, updateSettings } = useSettings()
  const dialogRef = useRef(null)
  const [, setLocation] = useLocation()

  const [localSettings, setLocalSettings] = useState(settings)

  // Sincronizar configuraciones locales cuando cambien las globales
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])
  const handleOutsideClick = (e) => {
    if (e.target === dialogRef.current) {
      dialogRef.current.close()
    }
  }
  const handleSettingsChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    updateSettings({ [key]: value })
  }

  const handleSaveSettings = () => {
    updateSettings(localSettings)
    dialogRef.current.close()
  }

  return (
    <div>
      <button
        className="btn btn-ghost btn-circle mb-2"
        onClick={() => dialogRef.current.showModal()}
      >
        <Cog size={30} className="transition-transform hover:rotate-180" />
      </button>
      <dialog
        ref={dialogRef}
        id="settings"
        className="modal animate-fade-in backdrop-blur-sm backdrop:bg-black/50"
        onClick={handleOutsideClick}
      >
        <div className="modal-box max-w-sm rounded-2xl p-6 md:max-w-lg">
          <div className="modal-header mb-4 flex items-center justify-between rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
            <h3 className="text-2xl font-bold">Configuraciones</h3>
          </div>

          <div className="text-base-content flex flex-col gap-6">
            {/* Configuración de tema */}
            <div className="card bg-base-200 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <SunMedium className="h-5 w-5" />
                Tema de la aplicación
              </h4>
              <label className="swap swap-rotate">
                <input
                  type="checkbox"
                  className="theme-controller hidden"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                />
                <div className="swap-on flex h-10 w-10 items-center justify-center rounded-full p-2">
                  <SunMedium className="h-10 w-10 text-white" />
                </div>
                <div className="swap-off flex h-10 w-10 items-center justify-center rounded-full p-2">
                  <Moon className="h-10 w-10" />
                </div>
              </label>
            </div>

            <div className="text-base-content flex flex-col items-center gap-4">
              <button
                className="btn btn-ghost w-full rounded-xl dark:text-white"
                onClick={() => setLocation('/createUser')}
              >
                Crear usuario
              </button>
            </div>

            {/* Configuración de precios */}
            <div className="card bg-base-200 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Calculator className="h-5 w-5" />
                Cálculo automático de precios
              </h4>

              <div className="space-y-4">
                {/* Activar/Desactivar cálculo automático */}
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Habilitar cálculo automático</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={localSettings.autoCalculatePrice}
                      onChange={(e) => handleSettingsChange('autoCalculatePrice', e.target.checked)}
                    />
                  </label>
                </div>

                {/* Tipo de margen */}
                {localSettings.autoCalculatePrice && (
                  <>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Tipo de margen</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={localSettings.markupType}
                        onChange={(e) => handleSettingsChange('markupType', e.target.value)}
                      >
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="fixed">Valor fijo ($)</option>
                      </select>
                    </div>

                    {/* Valor del margen */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          {localSettings.markupType === 'percentage'
                            ? 'Porcentaje de ganancia'
                            : 'Ganancia fija'}
                        </span>
                      </label>
                      <div className="join w-full">
                        <span className="join-item btn btn-outline btn-disabled">
                          {localSettings.markupType === 'percentage' ? (
                            <Percent className="h-4 w-4" />
                          ) : (
                            <DollarSign className="h-4 w-4" />
                          )}
                        </span>
                        <input
                          type="number"
                          className="input input-bordered join-item flex-1"
                          placeholder={localSettings.markupType === 'percentage' ? '50' : '100.00'}
                          value={localSettings.priceMarkupPercentage}
                          onChange={(e) =>
                            handleSettingsChange(
                              'priceMarkupPercentage',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step={localSettings.markupType === 'percentage' ? '1' : '0.01'}
                        />
                      </div>
                      <div className="label">
                        <span className="label-text-alt">
                          {localSettings.markupType === 'percentage'
                            ? 'Ejemplo: 50% significa que el precio de venta será 50% mayor al costo'
                            : 'Ejemplo: $100 se sumará al costo para obtener el precio de venta'}
                        </span>
                      </div>
                    </div>

                    {/* Vista previa del cálculo */}
                    <div className="alert alert-info">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Vista previa:</span>
                        <span className="text-sm">
                          {localSettings.markupType === 'percentage'
                            ? `Costo: $100 → Precio de venta: $${(100 * (1 + localSettings.priceMarkupPercentage / 100)).toFixed(2)}`
                            : `Costo: $100 → Precio de venta: $${(100 + localSettings.priceMarkupPercentage).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                Guardar y Cerrar
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
