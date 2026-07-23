import { Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { appText, pageCopy } from "../data/mockData";
import { useAsyncData } from "../hooks/useAsyncData";
import { hubApi } from "../services/api";

export interface NotificationsPageProps {}

export const NotificationsPage = ({}: Readonly<NotificationsPageProps>) => {
  const { data, isLoading, reload } = useAsyncData(() => hubApi.notifications(), []);
  const notifications = data ?? [];

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="stack">
      <PageHeader title={pageCopy.notifications.title} description={pageCopy.notifications.description} />
      <section className="notification-list">
        {notifications.map((item) => (
          <article key={item.id} className={item.isRead ? "notification-card read" : "notification-card"}>
            <div>
              <StatusBadge value={item.type} />
              <h2>{item.title}</h2>
              <p>{item.message}</p>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div className="row-actions">
              {item.actionUrl ? (
                <Link className="button button-secondary" to={item.actionUrl}>
                  <ExternalLink size={16} />
                  <span>{appText.actions.view}</span>
                </Link>
              ) : null}
              {!item.isRead ? (
                <Button variant="ghost" icon={<Check size={16} />} onClick={() => void hubApi.markNotificationRead(item.id).then(reload)}>
                  {appText.actions.markRead}
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
