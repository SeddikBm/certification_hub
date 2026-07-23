import { CheckCircle2, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { DataTable, type Column } from "../components/DataTable";
import { Field, SelectField, TextAreaField } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { SearchToolbar } from "../components/SearchToolbar";
import { StatusBadge } from "../components/StatusBadge";
import { appText, assignmentStatusOptions, pageCopy } from "../data/mockData";
import { useAsyncData } from "../hooks/useAsyncData";
import { useFilter } from "../hooks/useFilter";
import { hubApi } from "../services/api";
import type { Assignment } from "../types";

export interface AssignmentsPageProps {}

const blankAssignment: Partial<Assignment> = {
  itemType: "CERTIFICATION",
  itemId: "",
  userId: "",
  notes: ""
};

const statusOf = (item: Assignment) => item.statusCertification ?? item.statusTraining ?? "PLANNED";

export const AssignmentsPage = ({}: Readonly<AssignmentsPageProps>) => {
  const { data, isLoading, reload } = useAsyncData(() => hubApi.assignments({ size: 50 }), []);
  const [draft, setDraft] = useState<Partial<Assignment> | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Assignment | null>(null);
  const items = data?.content ?? [];
  const selector = useMemo(() => (item: Assignment) => `${item.userName} ${item.itemType} ${statusOf(item)} ${item.notes}`, []);
  const { query, setQuery, filtered } = useFilter(items, selector);

  const columns: Column<Assignment>[] = [
    { key: "person", title: "Collaborator", render: (item) => <strong>{item.userName}</strong> },
    { key: "type", title: "Type", render: (item) => <StatusBadge value={item.itemType} tone="neutral" /> },
    { key: "status", title: "Status", render: (item) => <StatusBadge value={statusOf(item)} /> },
    {
      key: "progress",
      title: "Progress",
      render: (item) => (
        <div className="progress-cell">
          <span style={{ width: `${item.trainingProgressPercentage ?? (statusOf(item) === "COMPLETED" ? 100 : 45)}%` }} />
        </div>
      )
    },
    { key: "date", title: "Assigned", render: (item) => new Date(item.assignedAt).toLocaleDateString() },
    { key: "notes", title: "Notes", render: (item) => item.notes ?? "No notes" },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
        <div className="row-actions">
          <Button variant="secondary" icon={<CheckCircle2 size={16} />} onClick={() => void hubApi.updateAssignment(item.id, { statusCertification: "COMPLETED", statusTraining: "COMPLETED" }).then(reload)}>
            Complete
          </Button>
          <Button variant="ghost" icon={<Upload size={16} />} onClick={() => setUploadTarget(item)}>
            Proof
          </Button>
        </div>
      )
    }
  ];

  const create = async () => {
    if (!draft) {
      return;
    }
    try {
      await hubApi.createAssignment(draft);
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
        title={pageCopy.assignments.title}
        description={pageCopy.assignments.description}
        actions={<Button icon={<Plus size={18} />} onClick={() => setDraft(blankAssignment)}>{appText.actions.assign}</Button>}
      />
      <SearchToolbar query={query} onQueryChange={setQuery} />
      <DataTable columns={columns} items={filtered} />
      <Modal open={Boolean(draft)} title="Assign item" onClose={() => setDraft(null)} footer={<Button onClick={() => void create()}>{appText.actions.create}</Button>}>
        {draft ? (
          <div className="form-grid">
            <SelectField label="Item type" value={draft.itemType} onChange={(event) => setDraft({ ...draft, itemType: event.target.value })}>
              <option>CERTIFICATION</option>
              <option>TRAINING</option>
            </SelectField>
            <Field label="Item ID" value={draft.itemId ?? ""} onChange={(event) => setDraft({ ...draft, itemId: event.target.value })} />
            <Field label="Collaborator ID" value={draft.userId ?? ""} onChange={(event) => setDraft({ ...draft, userId: event.target.value })} />
            <SelectField label="Starting status" value={statusOf(draft as Assignment)} onChange={(event) => setDraft({ ...draft, statusCertification: event.target.value, statusTraining: event.target.value })}>
              {assignmentStatusOptions.map((option) => <option key={option}>{option}</option>)}
            </SelectField>
            <TextAreaField className="span-2" label="Notes" value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </div>
        ) : null}
      </Modal>
      <Modal open={Boolean(uploadTarget)} title="Upload certificate proof" onClose={() => setUploadTarget(null)}>
        <div className="upload-zone">
          <Upload size={28} />
          <p>{uploadTarget?.userName}</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && uploadTarget) {
                void hubApi.uploadCertificate(uploadTarget.id, file).finally(() => setUploadTarget(null));
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
};
