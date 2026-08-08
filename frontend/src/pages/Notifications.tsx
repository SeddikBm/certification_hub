import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type NotificationResponse } from '../services/notification.service';
import clsx from 'clsx';

export function Notifications() {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<NotificationResponse[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getMyNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notif: NotificationResponse) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else {
      navigate('/manage-assignments');
    }
  };


  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>;
      case 'WARNING':
        return <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>;
      case 'ERROR':
        return <span className="material-symbols-outlined text-[20px] text-red-600">error</span>;
      default:
        return <span className="material-symbols-outlined text-[20px] text-blue-600">info</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center shadow-2xs">
            <span className="material-symbols-outlined text-[26px]">notifications</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Mes Notifications</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Consultez et gérez l'ensemble des alertes et mises à jour de vos parcours.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-4 py-2.5 text-xs font-bold text-[#b70f30] bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filter Navigation */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                filter === 'ALL'
                  ? "bg-[#b70f30] text-white shadow-2xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              Toutes ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                filter === 'UNREAD'
                  ? "bg-[#b70f30] text-white shadow-2xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <span>Non lues</span>
              {unreadCount > 0 && (
                <span className={clsx(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                  filter === 'UNREAD' ? "bg-white text-[#b70f30]" : "bg-red-50 text-[#b70f30]"
                )}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilter('READ')}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                filter === 'READ'
                  ? "bg-[#b70f30] text-white shadow-2xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              Déjà lues
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-3 border-[#b70f30] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <span className="material-symbols-outlined text-[48px] text-gray-300">notifications_off</span>
            <h3 className="text-sm font-bold text-gray-700">Aucune notification disponible</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {filter === 'UNREAD'
                ? 'Vous avez lu toutes vos notifications !'
                : 'Aucune alerte récente enregistrée.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={clsx(
                  "p-5 flex items-start gap-4 hover:bg-gray-50/80 transition-all cursor-pointer group relative",
                  !notif.isRead ? "bg-red-50/30" : "bg-white"
                )}
              >
                {/* Status Color Container */}
                <div className={clsx(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5",
                  notif.type === 'SUCCESS' ? "bg-emerald-50 border-emerald-100" :
                  notif.type === 'WARNING' ? "bg-amber-50 border-amber-100" :
                  notif.type === 'ERROR' ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
                )}>
                  {renderIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={clsx("text-sm font-bold", !notif.isRead ? "text-gray-900" : "text-gray-700")}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-gray-400 font-medium shrink-0">
                      {formatFullDate(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>

                {/* Unread Badge Indicator */}
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b70f30] shrink-0 self-center shadow-2xs"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
