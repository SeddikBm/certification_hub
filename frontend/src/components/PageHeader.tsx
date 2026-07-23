import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, eyebrow, actions }: Readonly<PageHeaderProps>) => (
  <header className="page-header">
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {actions ? <div className="page-actions">{actions}</div> : null}
  </header>
);
