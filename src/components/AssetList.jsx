import AssetCard from './AssetCard.jsx'

export default function AssetList({ positions, colorMap, onEdit, onDelete }) {
  const sorted = [...positions].sort((a, b) => b.valoreEUR - a.valoreEUR)

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-subtle-light dark:text-subtle-dark">
        Asset ({positions.length})
      </h2>
      <ul className="space-y-2">
        {sorted.map((position) => (
          <AssetCard
            key={position.id}
            position={position}
            color={colorMap.get(position.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  )
}
