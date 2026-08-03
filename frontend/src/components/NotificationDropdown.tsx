import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type NotificationResponse } from '../services/notification.service';
import clsx from 'clsx';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Notifications every 30 seconds or on focus
  const { data: notifications = [] } = useQuery<NotificationResponse[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getMyNotifications(),
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const latestFive = notifications.slice(0, 5);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: NotificationResponse) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else {
      navigate('/my-assignments');
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 3600));
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>;
      case 'WARNING':
        return <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>;
      case 'ERROR':
        return <span className="material-symbols-outlined text-[16px] text-red-600">error</span>;
      default:
        return <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all flex items-center justify-center cursor-pointer"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#b70f30] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-2xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#b70f30]">notifications</span>
              <h3 className="text-xs font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-[#b70f30] border border-red-100">
                  {unreadCount} non lue(s)
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-[11px] font-semibold text-[#b70f30] hover:text-red-800 hover:underline cursor-pointer transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List of Latest 5 Notifications */}
          <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
            {latestFive.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <span className="material-symbols-outlined text-[32px] text-gray-300">notifications_off</span>
                <p className="text-xs font-semibold">Aucune notification pour le moment</p>
              </div>
            ) : (
              latestFive.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={clsx(
                    "p-3.5 flex items-start gap-3 hover:bg-gray-50/80 transition-colors cursor-pointer group select-none relative",
                    !notif.isRead ? "bg-red-50/20" : "bg-white"
                  )}
                >
                  {/* Status Color Badge */}
                  <div className={clsx(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                    notif.type === 'SUCCESS' ? "bg-emerald-50 border-emerald-100" :
                    notif.type === 'WARNING' ? "bg-amber-50 border-amber-100" :
                    notif.type === 'ERROR' ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
                  )}>
                    {renderNotifIcon(notif.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={clsx("text-xs font-bold truncate", !notif.isRead ? "text-gray-900" : "text-gray-700")}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread Blue Dot */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#b70f30] shrink-0 self-center"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 bg-gray-50/60 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-bold text-[#b70f30] hover:text-red-800 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all"
            >
              <span>Voir toutes les notifications</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
