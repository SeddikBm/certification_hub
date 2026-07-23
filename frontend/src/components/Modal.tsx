import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { appText } from "../data/mockData";

export interface ModalProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  open: boolean;
  onClose: () => void;
}

export const Modal = ({ title, children, footer, open, onClose }: Readonly<ModalProps>) => {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <Button variant="ghost" icon={<X size={18} />} onClick={onClose} aria-label={appText.actions.close}>
            {appText.actions.close}
          </Button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </section>
    </div>
  );
};
