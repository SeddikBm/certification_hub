import { Inbox } from "lucide-react";
import { appText } from "../data/mockData";

export interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState = ({ title = appText.emptyTitle, description = appText.emptyDescription }: Readonly<EmptyStateProps>) => (
  <div className="empty-state">
    <Inbox size={32} />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);
