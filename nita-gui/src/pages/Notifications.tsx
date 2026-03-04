import { useEffect, useState } from 'react';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  data: {
    title?: string;
    message?: string;
    ticket_id?: number;
    approval_id?: number;
    kind?: string;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number | 'all'>(20);
    const [meta, setMeta] = useState<any | null>(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    try {
        const res = await api.get('/notifications', {
          params: {
            page: perPage === 'all' ? undefined : page,
            per_page: perPage === 'all' ? undefined : perPage,
            all: perPage === 'all' ? true : undefined,
          },
        });
        const data = res.data?.data ?? res.data ?? [];
        setNotifications(data);
        setMeta(res.data?.meta ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      loadNotifications();
    }, [page, perPage]);

  const markRead = async (id: string) => {
    setMarking(id);
    try {
      await api.post(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(null);
    }
  };

  const markAll = async () => {
    setMarking('all');
    try {
      await api.post('/notifications/read-all');
      await loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(null);
    }
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.read_at) {
      await markRead(item.id);
    }
    if (item.data.ticket_id) {
      navigate(`/tickets?ticket=${item.data.ticket_id}`);
    } else if (item.data.approval_id) {
      // If there's an approval, it's usually linked to a ticket anyway
      // but let's assume kind/ticket_id is provided in the data payload.
      // If only approval_id is here, we might need to fetch the ticket it belongs to
      // For now, if kind contains "ticket", we use ticket_id.
      if (item.data.ticket_id) {
        navigate(`/tickets?ticket=${item.data.ticket_id}`);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Bell size={20} />
          <div>
            <div className="text-sm font-bold uppercase tracking-widest">Notifications</div>
            <div className="text-xs text-slate-500">Ticket updates, approvals, and comments</div>
          </div>
        </div>
        <button
          className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
          onClick={markAll}
          disabled={marking === 'all'}
        >
          {marking === 'all' ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Mark all read
        </button>
      </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              value={perPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setPerPage(val);
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
            <button
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              onClick={() => {
                setPerPage('all');
                setPage(1);
              }}
            >
              See All
            </button>
          </div>
          {perPage !== 'all' && meta && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span>Page {meta?.current_page || page} of {meta?.last_page || 1}</span>
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
                disabled={!meta || page >= (meta?.last_page || 1)}
                onClick={() => setPage((p) => (meta ? Math.min(meta.last_page, p + 1) : p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Message</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td className="px-3 py-3" colSpan={4}>Loading...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td className="px-3 py-3 text-slate-500" colSpan={4}>No notifications yet.</td></tr>
              ) : notifications.map((n) => (
                <tr key={n.id} className={`${!n.read_at ? 'bg-amber-50 dark:bg-slate-800/40' : ''}`}>
                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">{n.data.title || 'Update'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{n.data.message || ''}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-60"
                      onClick={() => openNotification(n)}
                    >
                      <ExternalLink size={14} /> Open
                    </button>
                    {!n.read_at && (
                      <button
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-60"
                        onClick={() => markRead(n.id)}
                        disabled={marking === n.id}
                      >
                        {marking === n.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
