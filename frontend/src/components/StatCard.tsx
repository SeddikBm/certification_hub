import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}

export const StatCard = ({ label, value, detail, icon }: Readonly<StatCardProps>) => (
  <article className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  </article>
);
