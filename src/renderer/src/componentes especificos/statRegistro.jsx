import { DollarSign, Package, Archive } from 'lucide-react'

const icons = {
  dollar: DollarSign,
  package: Package,
  archive: Archive
}

const StatCard = ({ iconName, title, value, description, color }) => {
  const IconComponent = icons[iconName]

  const colorClasses = {
    border: `border-${color}`,
    text: `text-${color}`
  }

  return (
    <div
      className={`stat border-l-4 border-r-4 bg-base-100 ${colorClasses.border} transition-all duration-300 hover:bg-base-200`}
    >
      <div className={`stat-figure ${colorClasses.text}`}>
        {IconComponent && <IconComponent className="h-8 w-8" />}
      </div>
      <div className={`stat-title font-semibold ${colorClasses.text}`}>{title}</div>
      <div className="stat-value text-base-content">{value}</div>
      <div className="stat-desc text-base-content/70">{description}</div>
    </div>
  )
}

export default StatCard
