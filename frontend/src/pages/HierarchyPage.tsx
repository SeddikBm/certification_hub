import { GitBranch, UserRoundCheck } from "lucide-react";
import { DataTable, type Column } from "../components/DataTable";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { pageCopy } from "../data/mockData";
import { useAsyncData } from "../hooks/useAsyncData";
import { hubApi } from "../services/api";
import type { HierarchyNode } from "../types";

export interface HierarchyPageProps {}

export const HierarchyPage = ({}: Readonly<HierarchyPageProps>) => {
  const { data, isLoading } = useAsyncData(() => hubApi.hierarchy(), []);
  const items = data?.content ?? [];
  const totalCollaborators = items.reduce((sum, item) => sum + item.collaboratorCount, 0);

  const columns: Column<HierarchyNode>[] = [
    { key: "manager", title: "Career manager", render: (item) => <strong>{item.firstName} {item.lastName}</strong> },
    { key: "email", title: "Email", render: (item) => item.email },
    { key: "count", title: "Collaborators", render: (item) => item.collaboratorCount },
    {
      key: "coverage",
      title: "Coverage",
      render: (item) => (
        <div className="progress-cell">
          <span style={{ width: `${Math.min(100, item.collaboratorCount * 12)}%` }} />
        </div>
      )
    }
  ];

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="stack">
      <PageHeader title={pageCopy.hierarchy.title} description={pageCopy.hierarchy.description} />
      <section className="stats-grid compact">
        <StatCard label="Career managers" value={items.length} detail="Assigned owners" icon={<GitBranch size={22} />} />
        <StatCard label="Collaborators covered" value={totalCollaborators} detail="Across all managers" icon={<UserRoundCheck size={22} />} />
      </section>
      <DataTable columns={columns} items={items} />
    </div>
  );
};
