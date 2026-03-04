import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FilePlus2, Send, Paperclip, Loader2, ShieldCheck, User as UserIcon, Filter, AlertCircle, Info, ClipboardList, UserCheck, Users, MessagesSquare as ChatBubbleIcon, Lock, RefreshCw, ArrowUpDown } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  slug: string;
  category?: string | null;
}

interface User {
  id: number;
  name: string;
  username: string;
}

interface Attachment {
  id: number;
  original_name: string;
  url: string;
  mime_type?: string;
  size?: number;
}

interface Comment {
  id: number;
  body: string;
  user: User;
  created_at: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  service?: Service;
  creator?: User;
  assignee?: User | null;
  attachments?: Attachment[];
  comments?: Comment[];
  updated_at: string;
}

interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_OPTIONS = [
  { key: 'new', label: 'New', color: 'bg-slate-100 text-slate-700' },
  { key: 'assigned', label: 'Assigned', color: 'bg-amber-100 text-amber-700' },
  { key: 'info', label: 'Getting Info', color: 'bg-purple-100 text-purple-700' },
  { key: 'working', label: 'Working', color: 'bg-blue-100 text-blue-700' },
  { key: 'testing', label: 'Testing', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'done', label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'closed', label: 'Closed', color: 'bg-slate-200 text-slate-700' },
];

export default function TicketsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isIt = Array.isArray(user.roles) && user.roles.some((r: any) => ['IT Team', 'admin'].includes(r.name));
  const isAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => r.name === 'admin');

  const location = useLocation();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [handlers, setHandlers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showMineOnly, setShowMineOnly] = useState(!isIt);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [hideResolved, setHideResolved] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<number | ''>('');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('updated_at_desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [creatorFilter, setCreatorFilter] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');

  // New ticket form state
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  // Per-ticket comment inputs
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [commentFiles, setCommentFiles] = useState<Record<number, FileList | null>>({});
  const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number | 'all'>(20);
  const [meta, setMeta] = useState<PageMeta | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sortField, sortDirection] = sortBy.split('_');
      const params: Record<string, any> = {
        status: statusFilter || undefined,
        hide_closed: hideResolved || undefined,
        period: periodFilter || undefined,
        category: categoryFilter || undefined,
        sort_by: sortField,
        sort_dir: sortDirection,
        per_page: perPage === 'all' ? undefined : perPage,
        page: perPage === 'all' ? undefined : page,
        all: perPage === 'all' ? true : undefined,
      };

      if (isIt) {
        if (unassignedOnly) params.unassigned = true;
        if (assigneeFilter) params.assignee_id = assigneeFilter;
        if (showMineOnly) params.mine_only = true;
        if (creatorFilter) params.creator_id = creatorFilter;
      }

      const [svcRes, ticketRes, handlerRes] = await Promise.all([
        api.get('/services'),
        api.get('/tickets', { params }),
        api.get('/tickets/handlers'),
      ]);
      setServices(svcRes.data);
      const data = ticketRes.data?.data ?? ticketRes.data;
      setTickets(data);
      setMeta(ticketRes.data?.meta ?? null);
      setHandlers(handlerRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, showMineOnly, unassignedOnly, hideResolved, assigneeFilter, periodFilter, sortBy, categoryFilter, creatorFilter, page, perPage]);

  // Deep linking: check URL for ?ticket=ID
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ticketId = searchParams.get('ticket');
    if (ticketId && tickets.length > 0) {
      const found = tickets.find(t => String(t.id) === ticketId);
      if (found) {
        setSelectedTicket(found);
      } else {
        // Try to fetch it specifically if not in current page list
        api.get(`/tickets/${ticketId}`).then(res => {
          setSelectedTicket(res.data);
        }).catch(console.error);
      }
      // Clear the param from URL to prevent re-opening on manual refresh or back
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, tickets, navigate, location.pathname]);

  const toggleSort = (field: string) => {
    const [currentField, currentDir] = sortBy.split('_');
    const newDir = (currentField === field && currentDir === 'asc') ? 'desc' : 'asc';
    setSortBy(`${field}_${newDir}`);
    setPage(1);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  const creators = useMemo(() => {
    const map = new Map<number, User>();
    tickets.forEach((t) => {
      if (t.creator?.id) {
        map.set(t.creator.id, t.creator);
      }
    });
    return Array.from(map.values());
  }, [tickets]);

  const filteredTickets = useMemo(() => tickets, [tickets]);
  const adminReadOnly = isAdmin && selectedTicket?.assignee?.id !== user.id;

  const resetForm = () => {
    setServiceId('');
    setTitle('');
    setDescription('');
    setFiles(null);
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;
    setFormLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('service_id', String(serviceId));
      fd.append('title', title);
      fd.append('description', description);
      if (files) {
        Array.from(files).forEach((f) => fd.append('attachments[]', f));
      }
      await api.post('/tickets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ticket creation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const addComment = async (ticketId: number) => {
    const body = commentText[ticketId] || '';
    const filesForTicket = commentFiles[ticketId] || null;
    if (!body.trim() && !filesForTicket) return;
    setUpdatingTicketId(ticketId);
    setError('');
    try {
      const fd = new FormData();
      if (body) fd.append('body', body);
      if (filesForTicket) {
        Array.from(filesForTicket).forEach((f) => fd.append('attachments[]', f));
      }
      await api.post(`/tickets/${ticketId}/comment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCommentText((prev) => ({ ...prev, [ticketId]: '' }));
      setCommentFiles((prev) => ({ ...prev, [ticketId]: null }));
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to add comment');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const changeStatus = async (ticketId: number, status: string) => {
    setUpdatingTicketId(ticketId);
    setError('');
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const assignTicket = async (ticketId: number, assigneeId: number | null) => {
    setUpdatingTicketId(ticketId);
    setError('');
    try {
      await api.patch(`/tickets/${ticketId}/assign`, { assignee_id: assigneeId });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const isClosedTicket = (ticket: Ticket) => ticket.status === 'closed';

  const reopenTicket = async (ticketId: number) => {
    setUpdatingTicketId(ticketId);
    setError('');
    try {
      await api.post(`/tickets/${ticketId}/reopen`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reopen ticket');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const statusBadge = (status: string) => {
    const meta = STATUS_OPTIONS.find((s) => s.key === status) || STATUS_OPTIONS[0];
    return <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${meta.color}`}>{meta.label}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Complaint & Ticket Desk</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Submit issues against services, track progress, and collaborate with IT.</p>
        </div>
        <div className="flex gap-2 flex-wrap text-xs">
          <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">Tickets: {meta?.total ?? filteredTickets.length}</div>
          {isIt && <div className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-mono">IT view</div>}
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle size={20} className="mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Create ticket */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
          <FilePlus2 size={18} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Raise a complaint</h3>
        </div>
        <form onSubmit={submitTicket} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Service</label>
              <select
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                value={serviceId}
                onChange={(e) => setServiceId(Number(e.target.value))}
                required
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
              <input
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
            <textarea
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
              <Paperclip size={16} /> Attach images/PDF (max 20MB each)
              <input type="file" className="hidden" multiple accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={(e) => setFiles(e.target.files)} />
            </label>
            {files && <span className="text-xs text-slate-500">{files.length} file(s) selected</span>}
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {formLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Submit Ticket
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-semibold">
          <Filter size={16} /> Filters
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            value={periodFilter}
            onChange={(e) => { setPeriodFilter(e.target.value); setPage(1); }}
          >
            <option value="">Any Time</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last365">Last 12 Months</option>
          </select>
          <select
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="updated_at_desc">Latest Updates</option>
            <option value="updated_at_asc">Oldest Updates</option>
            <option value="created_at_desc">Newest Created</option>
            <option value="created_at_asc">Oldest Created</option>
          </select>
          {isIt && (
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <input type="checkbox" checked={showMineOnly} onChange={(e) => {
                  setShowMineOnly(e.target.checked);
                  if (e.target.checked) {
                    setUnassignedOnly(false);
                    setAssigneeFilter('');
                    setCreatorFilter('');
                  }
                  setPage(1);
                }} />
                My Raised Tickets
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setUnassignedOnly(e.target.checked);
                    if (e.target.checked) {
                      setAssigneeFilter('');
                      setShowMineOnly(false);
                    }
                    setPage(1);
                  }}
                />
                Unassigned Only
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <input type="checkbox" checked={hideResolved} onChange={(e) => { setHideResolved(e.target.checked); setPage(1); }} />
                Opened Only
              </label>
              <select
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                value={assigneeFilter}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setAssigneeFilter(val);
                  if (val) {
                    setUnassignedOnly(false);
                    setShowMineOnly(false);
                  }
                  setPage(1);
                }}
              >
                <option value="">All Handlers</option>
                <option value={user.id}>Assigned to Me</option>
                {handlers.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} ({h.username})</option>
                ))}
              </select>
              <select
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                value={creatorFilter}
                onChange={(e) => {
                  setCreatorFilter(e.target.value ? Number(e.target.value) : '');
                  if (e.target.value) setShowMineOnly(false);
                  setPage(1);
                }}
              >
                <option value="">All Requesters</option>
                <option value={user.id}>Raised by Me</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.username})</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {!isIt && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <input type="checkbox" checked={hideResolved} onChange={(e) => { setHideResolved(e.target.checked); setPage(1); }} />
              Opened Only
            </label>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold">
          <span>View:</span>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${viewMode === 'table' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
          >
            Compact table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${viewMode === 'cards' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
          >
            Cards
          </button>
        </div>
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
            See all
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

      {/* Tickets list */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 flex items-center gap-2">
            <Info size={16} /> No tickets yet.
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => toggleSort('id')} className="flex items-center gap-1 hover:text-blue-500 transition-colors">ID <ArrowUpDown size={12} /></button>
                  </th>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-blue-500 transition-colors">Title <ArrowUpDown size={12} /></button>
                  </th>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">Service</th>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">Status</th>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">Assignee</th>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => toggleSort('creator_name')} className="flex items-center gap-1 hover:text-blue-500 transition-colors">Requester <ArrowUpDown size={12} /></button>
                  </th>
                  <th className="px-3 py-3 text-left border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => toggleSort('updated_at')} className="flex items-center gap-1 hover:text-blue-500 transition-colors">Last Update <ArrowUpDown size={12} /></button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-slate-500">#{t.id}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">{t.title}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{t.service?.name}</td>
                    <td className="px-3 py-3">{statusBadge(t.status)}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-400" />
                        {t.assignee?.name || <span className="text-slate-400 italic">Unassigned</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={12} className="text-slate-400" />
                        {t.creator?.name || t.creator?.username}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(t.updated_at).toLocaleDateString()} {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const locked = isClosedTicket(t);
            const canReopen = ['done', 'closed'].includes(t.status) && t.creator?.id === user.id;
            return (
              <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.title}</h3>
                      {statusBadge(t.status)}
                      {locked && (
                        <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Lock size={12} /> Closed
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 flex gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><ClipboardList size={14} /> {t.service?.name || 'Service'}</span>
                      <span className="flex items-center gap-1"><UserIcon size={14} /> Raised by {t.creator?.name || t.creator?.username}</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={14} /> {t.assignee ? `Assigned to ${t.assignee.name}` : 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isIt && (
                      <select
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        value={t.status}
                        onChange={(e) => changeStatus(t.id, e.target.value)}
                        disabled={updatingTicketId === t.id || locked}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    )}
                    {isIt && (
                      <div className="flex items-center gap-1">
                        <select
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                          value={t.assignee?.id || ''}
                          onChange={(e) => assignTicket(t.id, e.target.value ? Number(e.target.value) : null)}
                          disabled={updatingTicketId === t.id || locked}
                        >
                          <option value="">Unassigned</option>
                          {handlers.map((h) => (
                            <option key={h.id} value={h.id}>{h.name} ({h.username})</option>
                          ))}
                        </select>
                        <button
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-60"
                          onClick={() => assignTicket(t.id, user.id)}
                          disabled={updatingTicketId === t.id || locked}
                        >
                          <UserCheck size={14} /> Take
                        </button>
                      </div>
                    )}
                    {canReopen && (
                      <button
                        className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-60"
                        onClick={() => reopenTicket(t.id)}
                        disabled={updatingTicketId === t.id}
                      >
                        <RefreshCw size={14} /> Reopen
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{t.description}</p>

                {t.attachments && t.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.attachments.map((a) => (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Paperclip size={14} /> {a.original_name}
                      </a>
                    ))}
                  </div>
                )}

                {/* Comments */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                    <ChatBubbleIcon /> Updates & Comments
                  </div>
                  {locked && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                      <Lock size={14} /> Ticket is closed. Reopen to add updates.
                    </div>
                  )}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {t.comments && t.comments.length > 0 ? (
                      t.comments.map((c) => (
                        <div key={c.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                          <div className="text-xs text-slate-500 flex gap-2 items-center">
                            <Users size={12} /> {c.user?.name || c.user?.username}
                            <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                          {c.body && <div className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-line">{c.body}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400">No updates yet.</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      rows={2}
                      placeholder="Add a comment or update"
                      value={commentText[t.id] || ''}
                      onChange={(e) => setCommentText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      disabled={updatingTicketId === t.id || locked}
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer text-slate-600 dark:text-slate-300">
                        <Paperclip size={14} /> Attach
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".png,.jpg,.jpeg,.svg,.pdf"
                          onChange={(e) => setCommentFiles((prev) => ({ ...prev, [t.id]: e.target.files }))}
                          disabled={updatingTicketId === t.id || locked}
                        />
                      </label>
                      {commentFiles[t.id] && <span className="text-xs text-slate-500">{commentFiles[t.id]?.length} file(s)</span>}
                      <button
                        onClick={() => addComment(t.id)}
                        disabled={updatingTicketId === t.id || locked}
                        className="ml-auto px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-60"
                      >
                        {updatingTicketId === t.id ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Post update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Ticket #{selectedTicket.id}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedTicket.title}</div>
              </div>
              <div className="flex items-center gap-2">{statusBadge(selectedTicket.status)}</div>
            </div>
            {adminReadOnly && (
              <div className="bg-amber-50 dark:bg-amber-900/10 p-3 mx-4 mt-4 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck size={16} /> Admin View: You are in read-only mode for this ticket.
              </div>
            )}
            <div className="p-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="flex flex-wrap gap-3 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1"><ClipboardList size={14} /> {selectedTicket.service?.name}</span>
                <span className="flex items-center gap-1"><UserIcon size={14} /> Raised by {selectedTicket.creator?.name || selectedTicket.creator?.username}</span>
                <span className="flex items-center gap-1"><ShieldCheck size={14} /> {selectedTicket.assignee ? `Assigned to ${selectedTicket.assignee.name}` : 'Unassigned'}</span>
              </div>
              <div className="whitespace-pre-line">{selectedTicket.description}</div>
              {selectedTicket.attachments?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.attachments.map((a) => (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Paperclip size={14} /> {a.original_name}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                  <ChatBubbleIcon /> Thread
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedTicket.comments?.length ? selectedTicket.comments.map((c) => (
                    <div key={c.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                      <div className="text-xs text-slate-500 flex gap-2 items-center">
                        <Users size={12} /> {c.user?.name || c.user?.username}
                        <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      {c.body && <div className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-line">{c.body}</div>}
                    </div>
                  )) : <div className="text-xs text-slate-400">No updates yet.</div>}
                </div>
              </div>

              {!adminReadOnly && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                    <ChatBubbleIcon size={14} /> Add an update
                  </div>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    rows={3}
                    placeholder="Type your comment or approval/rejection notes here..."
                    value={commentText[selectedTicket.id] || ''}
                    onChange={(e) => setCommentText((prev) => ({ ...prev, [selectedTicket.id!]: e.target.value }))}
                    disabled={updatingTicketId === selectedTicket.id || isClosedTicket(selectedTicket)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer text-slate-600 dark:text-slate-300">
                      <Paperclip size={14} /> Attach
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".png,.jpg,.jpeg,.svg,.pdf"
                        onChange={(e) => setCommentFiles((prev) => ({ ...prev, [selectedTicket.id!]: e.target.files }))}
                        disabled={updatingTicketId === selectedTicket.id || isClosedTicket(selectedTicket)}
                      />
                    </label>
                    {commentFiles[selectedTicket.id] && <span className="text-xs text-slate-500">{commentFiles[selectedTicket.id]?.length} files selected</span>}
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => addComment(selectedTicket.id)}
                        disabled={updatingTicketId === selectedTicket.id || isClosedTicket(selectedTicket)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-60"
                      >
                        {updatingTicketId === selectedTicket.id ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Post Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-right space-x-2">
              {isIt && !isAdmin && !isClosedTicket(selectedTicket) && (
                <button
                  onClick={() => changeStatus(selectedTicket.id, 'done')}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Mark as Done
                </button>
              )}
              <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
