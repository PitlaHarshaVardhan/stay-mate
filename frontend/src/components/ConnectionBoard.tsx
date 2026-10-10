import { useMemo, useState } from 'react';
import { Check, MessageSquare, Trash2, UserCheck, Clock, XCircle, ArrowRight } from 'lucide-react';
import Pagination, { PAGE_SIZE } from './Pagination';
import type { ConnectionItem } from '../types';

type ConnectionBoardProps = {
  userId: string;
  items: ConnectionItem[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onMessage?: (receiverId: string) => void;
};

export default function ConnectionBoard({
  userId,
  items,
  onAccept,
  onReject,
  onDelete,
  onMessage,
}: ConnectionBoardProps) {
  const grouped = useMemo(
    () => ({
      pending: items.filter((item) => item.status === 'PENDING'),
      accepted: items.filter((item) => item.status === 'ACCEPTED'),
      rejected: items.filter((item) => item.status === 'REJECTED'),
    }),
    [items],
  );

  const renderCard = (item: ConnectionItem) => {
    const isIncoming = item.receiverId === userId;
    const otherUser = isIncoming ? item.sender : item.receiver;
    const directionLabel = isIncoming ? 'Incoming request' : 'Outgoing request';

    return (
      <div
        key={item.id}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <AvatarPreview
                name={otherUser?.name ?? 'User'}
                photo={otherUser?.profile?.profilePhoto ?? null}
                size="md"
              />
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {otherUser?.name ?? 'User'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  <span>{directionLabel}</span>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                item.status === 'ACCEPTED'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                  : item.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60'
              }`}
            >
              {item.status === 'ACCEPTED' && <UserCheck size={12} />}
              {item.status === 'PENDING' && <Clock size={12} />}
              {item.status === 'REJECTED' && <XCircle size={12} />}
              <span>{item.status}</span>
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 border border-slate-100">
            <span className="font-medium text-slate-700">Occupation: </span>
            {otherUser?.profile?.occupationType ? otherUser.profile.occupationType : 'Not specified'}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {item.status === 'PENDING' && isIncoming && (
              <>
                <button
                  type="button"
                  onClick={() => onAccept(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  type="button"
                  onClick={() => onReject(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {item.status === 'PENDING' && !isIncoming && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <Clock size={13} /> Awaiting response
              </span>
            )}
            {item.status === 'ACCEPTED' && (
              <>
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <UserCheck size={13} /> Connected
                </span>
                {onMessage && otherUser?.id && (
                  <button
                    type="button"
                    onClick={() => onMessage(otherUser.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <MessageSquare size={13} /> Chat <ArrowRight size={12} />
                  </button>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
            title="Remove connection"
          >
            <Trash2 size={13} />
            <span className="sr-only">Remove</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Section
        title="Pending Requests"
        items={grouped.pending}
        renderCard={renderCard}
        emptyText="No pending connection requests."
      />
      <Section
        title="Connected Roommates"
        items={grouped.accepted}
        renderCard={renderCard}
        emptyText="You haven’t connected with anyone yet. Explore matches to find roommates!"
      />
      {grouped.rejected.length > 0 && (
        <Section
          title="Past / Rejected"
          items={grouped.rejected}
          renderCard={renderCard}
          emptyText="No archived requests."
        />
      )}
    </div>
  );
}

function AvatarPreview({
  name,
  photo,
  size = 'md',
}: {
  name: string;
  photo?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
  };

  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeMap[size]} shrink-0 rounded-full object-cover ring-2 ring-indigo-100 shadow-sm`}
        onError={(event) => {
          const target = event.currentTarget as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} shrink-0 flex items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-xs`}
    >
      {initials}
    </div>
  );
}

function Section({
  title,
  items,
  renderCard,
  emptyText,
}: {
  title: string;
  items: ConnectionItem[];
  renderCard: (item: ConnectionItem) => JSX.Element;
  emptyText: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const visibleItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {items.length}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">{visibleItems.map(renderCard)}</div>
          <Pagination
            page={currentPage}
            totalItems={items.length}
            onPageChange={setPage}
            label={`${title} connections`}
          />
        </>
      )}
    </section>
  );
}
