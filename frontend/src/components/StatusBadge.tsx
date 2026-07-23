export interface StatusBadgeProps {
  value?: string | number;
  tone?: "brand" | "success" | "warning" | "danger" | "neutral" | "info";
}

const toneFromValue = (value?: string | number): StatusBadgeProps["tone"] => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("active") || normalized.includes("success")) {
    return "success";
  }
  if (normalized.includes("progress") || normalized.includes("p0")) {
    return "brand";
  }
  if (normalized.includes("warning") || normalized.includes("high") || normalized.includes("planned")) {
    return "warning";
  }
  if (normalized.includes("fail") || normalized.includes("inactive") || normalized.includes("error")) {
    return "danger";
  }
  if (normalized.includes("info") || normalized.includes("normal") || normalized.includes("optional")) {
    return "info";
  }
  return "neutral";
};

export const StatusBadge = ({ value, tone }: Readonly<StatusBadgeProps>) => (
  <span className={`status-badge status-${tone ?? toneFromValue(value)}`}>{String(value ?? "N/A").replace(/_/g, " ")}</span>
);
