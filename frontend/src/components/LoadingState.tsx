import { Loader2 } from "lucide-react";
import { appText } from "../data/mockData";

export interface LoadingStateProps {
  label?: string;
}

export const LoadingState = ({ label = appText.loading }: Readonly<LoadingStateProps>) => (
  <div className="loading-state">
    <Loader2 size={22} />
    <span>{label}</span>
  </div>
);
