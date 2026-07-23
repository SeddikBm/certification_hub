import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { DataTable, type Column } from "../components/DataTable";
import { Field, SelectField } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { SearchToolbar } from "../components/SearchToolbar";
import { StatusBadge } from "../components/StatusBadge";
import { appText, pageCopy, roleOptions } from "../data/mockData";
import { useAsyncData } from "../hooks/useAsyncData";
import { useFilter } from "../hooks/useFilter";
import { hubApi } from "../services/api";
import type { User } from "../types";

export interface UsersPageProps {}

const blankUser: Partial<User> & { password?: string } = {
  email: "",
  password: "Welcome@123",
  firstName: "",
  lastName: "",
  role: "COLLABORATOR",
  status: "ACTIVE",
  hireDate: new Date().toISOString().slice(0, 10)
};

export const UsersPage = ({}: Readonly<UsersPageProps>) => {
  const { data, isLoading, reload } = useAsyncData(() => hubApi.users({ size: 50 }), []);
  const [draft, setDraft] = useState<(Partial<User> & { password?: string }) | null>(null);
  const items = data?.content ?? [];
  const selector = useMemo(() => (item: User) => `${item.firstName} ${item.lastName} ${item.email} ${item.role} ${item.squadName}`, []);
  const { query, setQuery, filtered } = useFilter(items, selector);

  const columns: Column<User>[] = [
    { key: "name", title: "Name", render: (item) => <strong>{item.firstName} {item.lastName}</strong> },
    { key: "email", title: "Email", render: (item) => item.email },
    { key: "role", title: "Role", render: (item) => <StatusBadge value={item.role} tone="neutral" /> },
    { key: "squad", title: "Squad", render: (item) => item.squadName ?? "Unassigned" },
    { key: "status", title: "Status", render: (item) => <StatusBadge value={item.status} /> },
    { key: "hired", title: "Hire date", render: (item) => item.hireDate ?? "N/A" }
  ];

  const create = async () => {
    if (!draft) {
      return;
    }
    try {
      await hubApi.createUser(draft);
      await reload();
    } finally {
      setDraft(null);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="stack">
      <PageHeader
        title={pageCopy.users.title}
        description={pageCopy.users.description}
        actions={<Button icon={<Plus size={18} />} onClick={() => setDraft(blankUser)}>{appText.actions.add}</Button>}
      />
      <SearchToolbar query={query} onQueryChange={setQuery} />
      <DataTable columns={columns} items={filtered} />
      <Modal open={Boolean(draft)} title="Create user" onClose={() => setDraft(null)} footer={<Button onClick={() => void create()}>{appText.actions.create}</Button>}>
        {draft ? (
          <div className="form-grid">
            <Field label="First name" value={draft.firstName ?? ""} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} />
            <Field label="Last name" value={draft.lastName ?? ""} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} />
            <Field label="Email" type="email" value={draft.email ?? ""} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            <Field label="Password" type="password" value={draft.password ?? ""} onChange={(event) => setDraft({ ...draft, password: event.target.value })} />
            <SelectField label="Role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as User["role"] })}>
              {roleOptions.map((option) => <option key={option}>{option}</option>)}
            </SelectField>
            <Field label="Hire date" type="date" value={draft.hireDate ?? ""} onChange={(event) => setDraft({ ...draft, hireDate: event.target.value })} />
            <Field className="span-2" label="Phone" value={draft.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
