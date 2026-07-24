import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../hooks/useChartTheme.js'
import { formatAxisEUR, formatEUR, formatFullDate, formatShortDate } from '../utils/format.js'

function ChartTooltip({ active, payload, label, palette }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{ background: palette.surface, borderColor: palette.grid, color: palette.ink }}
    >
      <p style={{ color: palette.subtle }}>{formatFullDate(label)}</p>
      <p className="tabular font-semibold">{formatEUR(payload[0].value)}</p>
    </div>
  )
}

/** Dominio con un po' di respiro: uno zero forzato appiattirebbe la curva. */
function valueDomain(snapshots) {
  const values = snapshots.map((s) => Number(s.valoreTotaleEUR) || 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.2, max * 0.02, 1)
  return [Math.max(0, min - pad), max + pad]
}

export default function HistoryLineChart({ snapshots }) {
  const palette = useChartTheme()

  return (
    <section className="card">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle-light dark:text-subtle-dark">
        Andamento del valore totale (EUR)
      </h2>

      {snapshots.length < 2 ? (
        <p className="mt-6 text-sm text-subtle-light dark:text-subtle-dark">
          {snapshots.length === 0
            ? 'Lo storico si popola con uno snapshot al giorno, a partire da oggi.'
            : 'Serve almeno un secondo giorno di rilevazione per disegnare la curva.'}
        </p>
      ) : (
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={snapshots} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={palette.grid} strokeWidth={1} vertical={false} />
              <XAxis
                dataKey="data"
                tickFormatter={formatShortDate}
                tick={{ fill: palette.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: palette.axis }}
                minTickGap={24}
              />
              <YAxis
                domain={valueDomain(snapshots)}
                tickFormatter={formatAxisEUR}
                tick={{ fill: palette.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                content={<ChartTooltip palette={palette} />}
                cursor={{ stroke: palette.axis, strokeWidth: 1 }}
              />
              <Line
                type="linear"
                dataKey="valoreTotaleEUR"
                stroke={palette.series[0]}
                strokeWidth={2}
                dot={
                  snapshots.length <= 30
                    ? { r: 4, fill: palette.series[0], stroke: palette.surface, strokeWidth: 2 }
                    : false
                }
                activeDot={{ r: 5, fill: palette.series[0], stroke: palette.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
