import { ExternalLink, Star } from "lucide-react";
import type { Certification, Training } from "../types";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import { appText } from "../data/mockData";

type CatalogItem = Certification | Training;

export interface CatalogCardProps {
  item: CatalogItem;
  kind: "certification" | "training";
  onEdit: () => void;
  onDelete: () => void;
}

const isTraining = (item: CatalogItem): item is Training => "title" in item;
const getName = (item: CatalogItem) => (isTraining(item) ? item.title : item.name);
const getCost = (item: CatalogItem) => (isTraining(item) ? item.costUsd : item.examCostUsd);
const getSecondaryLabel = (item: CatalogItem) => (isTraining(item) ? item.type : item.difficulty);

export const CatalogCard = ({ item, kind, onEdit, onDelete }: Readonly<CatalogCardProps>) => (
  <article className="catalog-card">
    <header>
      <div>
        <p className="code">{isTraining(item) ? item.type : item.code}</p>
        <h2>{getName(item)}</h2>
      </div>
      <StatusBadge value={item.priority} />
    </header>
    <div className="catalog-meta">
      <span>{item.provider}</span>
      <StatusBadge value={getSecondaryLabel(item)} tone="neutral" />
    </div>
    <dl>
      <div>
        <dt>Cost</dt>
        <dd>{getCost(item) ? `$${getCost(item)}` : "Included"}</dd>
      </div>
      <div>
        <dt>Squads</dt>
        <dd>{item.associatedSquads?.length ?? 0}</dd>
      </div>
      {"averageRating" in item ? (
        <div>
          <dt>Rating</dt>
          <dd className="rating"><Star size={15} /> {item.averageRating ?? "N/A"}</dd>
        </div>
      ) : null}
    </dl>
    <footer>
      {"officialUrl" in item && item.officialUrl ? (
        <a href={item.officialUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          {appText.actions.view}
        </a>
      ) : null}
      {"url" in item && item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          {appText.actions.view}
        </a>
      ) : null}
      <Button variant="secondary" onClick={onEdit}>{appText.actions.edit}</Button>
      <Button variant="danger" onClick={onDelete}>{appText.actions.delete}</Button>
    </footer>
  </article>
);
