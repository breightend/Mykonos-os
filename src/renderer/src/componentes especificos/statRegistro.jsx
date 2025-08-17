// Importa los íconos que necesites
import { DollarSign, Package, Archive } from 'lucide-react'

// Un mapa para obtener el componente del ícono a partir de un string
const icons = {
  dollar: DollarSign,
  package: Package,
  archive: Archive
}

const StatCard = ({ iconName, title, value, description, color }) => {
  const IconComponent = icons[iconName]

  // Clases dinámicas para los colores
  const colorClasses = {
    border: `border-${color}`,
    text: `text-${color}`
  }

  return (
    <div
      className={`stat border-l-4 bg-base-100 ${colorClasses.border} transition-all duration-300 hover:scale-[1.02] hover:bg-base-200`}
    >
      <div className={`stat-figure ${colorClasses.text}`}>
        {IconComponent && <IconComponent className="h-8 w-8" />}
      </div>
      <div className={`stat-title font-semibold ${colorClasses.text}`}>{title}</div>
      <div className="stat-value text-base-content">{value}</div>
      <div className="text-base-content/70 stat-desc">{description}</div>
    </div>
  )
}

export default StatCard
