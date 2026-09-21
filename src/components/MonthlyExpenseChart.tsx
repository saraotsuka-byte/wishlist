import type { MonthlyExpense } from '../domain/expense'

interface MonthlyExpenseChartProps {
  data: MonthlyExpense[]
}

function niceMax(value: number): number {
  if (value <= 0) return 1000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

export function MonthlyExpenseChart({ data }: MonthlyExpenseChartProps) {
  const max = niceMax(Math.max(...data.map((d) => d.total), 0))
  const width = 320
  const height = 160
  const paddingLeft = 44
  const paddingBottom = 20
  const paddingTop = 20
  const chartWidth = width - paddingLeft
  const chartHeight = height - paddingBottom - paddingTop
  const barSlot = chartWidth / data.length
  const barWidth = Math.min(24, barSlot * 0.55)

  return (
    <div className="[--bar-color:#74D8D8] dark:[--bar-color:#AFE9E9]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="月ごとの消耗品支出"
        className="w-full"
      >
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={width}
          y2={paddingTop}
          className="stroke-gray-200 dark:stroke-gray-800"
          strokeWidth={1}
        />
        <text
          x={paddingLeft - 6}
          y={paddingTop + 4}
          textAnchor="end"
          className="fill-gray-400 text-[9px] dark:fill-gray-500"
        >
          ¥{max.toLocaleString()}
        </text>
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width}
          y2={paddingTop + chartHeight}
          className="stroke-gray-300 dark:stroke-gray-700"
          strokeWidth={1}
        />
        <text
          x={paddingLeft - 6}
          y={paddingTop + chartHeight + 4}
          textAnchor="end"
          className="fill-gray-400 text-[9px] dark:fill-gray-500"
        >
          ¥0
        </text>

        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.total / max) * chartHeight : 0
          const x = paddingLeft + i * barSlot + (barSlot - barWidth) / 2
          const y = paddingTop + chartHeight - barHeight
          return (
            <g key={d.key}>
              <title>
                {d.label}: ¥{d.total.toLocaleString()}
              </title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, d.total > 0 ? 2 : 0)}
                rx={4}
                fill="var(--bar-color)"
              />
              {d.total > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-gray-600 text-[8px] dark:fill-gray-300"
                >
                  {d.total >= 1000 ? `${Math.round(d.total / 100) / 10}k` : d.total}
                </text>
              )}
              <text
                x={paddingLeft + i * barSlot + barSlot / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-gray-500 text-[9px] dark:fill-gray-400"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      <table className="sr-only">
        <caption>月ごとの消耗品支出</caption>
        <thead>
          <tr>
            <th scope="col">月</th>
            <th scope="col">支出額</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <td>{d.label}</td>
              <td>¥{d.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
