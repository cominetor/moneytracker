import Header from './Header.jsx'
import BackupControls from './BackupControls.jsx'
import AllocationPieChart from './AllocationPieChart.jsx'
import HistoryLineChart from './HistoryLineChart.jsx'
import AssetList from './AssetList.jsx'
import EmptyState from './EmptyState.jsx'

export default function Dashboard({
  portfolio,
  colorMap,
  onAdd,
  onEdit,
  onDelete,
  onOpenSettings,
  onRestored,
}) {
  const { holdings, positions, allocation, snapshots, totals, updatedAt, hasStalePrices, refreshing, rateLimit, refresh } =
    portfolio

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-16 sm:p-6">
      <Header
        totals={totals}
        updatedAt={updatedAt}
        hasStalePrices={hasStalePrices}
        refreshing={refreshing}
        rateLimit={rateLimit}
        onRefresh={refresh}
        onOpenSettings={onOpenSettings}
      >
        <button type="button" className="btn-primary" onClick={onAdd}>
          Aggiungi asset
        </button>
        <BackupControls onRestored={onRestored} />
      </Header>

      {holdings.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <>
          <AllocationPieChart allocation={allocation} colorMap={colorMap} />
          <HistoryLineChart snapshots={snapshots} />
          <AssetList
            positions={positions}
            colorMap={colorMap}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  )
}
