import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useChartTheme } from '../hooks/useChartTheme.js'
import { formatEUR, formatPercent } from '../utils/format.js'

/** Le quote oltre gli 8 slot categoriali confluiscono in "Altri". */
function foldSlices(allocation, colorMap, palette) {
  const slices = []
  let other = 0
  for (const item of allocation) {
    const color = colorMap.get(item.id)
    if (!color || color === palette.other) {
      other += item.valoreEUR
    } else {
      slices.push({ ...item, color })
    }
  }
  if (other > 0) {
    const totale = allocation.reduce((sum, a) => sum + a.valoreEUR, 0)
    slices.push({
      id: '__altri__',
      ticker: 'Altri',
      nome: 'Altri asset',
      valoreEUR: other,
      percentuale: totale ? (other / totale) * 100 : 0,
      color: palette.other,
    })
  }
  return slices
}

function ChartTooltip({ active, payload, palette }) {
  if (!active || !payload?.length) return null
  const slice = payload[0].payload
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{ background: palette.surface, borderColor: palette.grid, color: palette.ink }}
    >
      <p className="font-semibold">{slice.ticker}</p>
      <p className="tabular" style={{ color: palette.subtle }}>
        {formatEUR(slice.valoreEUR)} · {formatPercent(slice.percentuale)}
      </p>
    </div>
  )
}

export default function AllocationPieChart({ allocation, colorMap }) {
  const palette = useChartTheme()
  const slices = foldSlices(allocation, colorMap, palette)

  return (
    <section className="card">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle-light dark:text-subtle-dark">
        Allocazione
      </h2>

      {slices.length === 0 ? (
        <p className="mt-6 text-sm text-subtle-light dark:text-subtle-dark">
          Nessun prezzo disponibile: l'allocazione compare quando le quotazioni sono state
          recuperate almeno una volta.
        </p>
      ) : (
        <>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="valoreEUR"
                  nameKey="ticker"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={1}
                  stroke={palette.surface}
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip palette={palette} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* legenda con etichette diretta: l'identità non è affidata al solo colore */}
          <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {slices.map((slice) => (
              <li key={slice.id} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{slice.ticker}</span>
                </span>
                <span className="tabular shrink-0 text-subtle-light dark:text-subtle-dark">
                  {formatPercent(slice.percentuale)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
