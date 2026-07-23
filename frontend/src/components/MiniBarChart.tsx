import type { ChartData } from "../types";

export interface MiniBarChartProps {
  title: string;
  data: ChartData[];
}

export const MiniBarChart = ({ title, data }: Readonly<MiniBarChartProps>) => {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      <div className="bar-list">
        {data.map((item) => (
          <div className="bar-row" key={item.label}>
            <div className="bar-meta">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="bar-track">
              <span style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
