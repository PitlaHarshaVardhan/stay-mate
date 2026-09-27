import { useMemo } from 'react';
import type { ConnectionItem } from '../types';

type ConnectionBoardProps = {
  userId: string;
  items: ConnectionItem[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ConnectionBoard({ userId, items, onAccept, onReject, onDelete }: ConnectionBoardProps) {
  const grouped = useMemo(() => ({
    pending: items.filter((item) => item.status === 'PENDING'),
    accepted: items.filter((item) => item.status === 'ACCEPTED'),
    rejected: items.filter((item) => item.status === 'REJECTED'),
  }), [items]);

  const renderCard = (item: ConnectionItem) => {
    const isIncoming = item.receiverId === userId;
    const otherUser = isIncoming ? item.sender : item.receiver;
    const directionLabel = isIncoming ? 'Incoming request' : 'Outgoing request';
    const badgeTone = item.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';

    return (
      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AvatarPreview name={otherUser?.name ?? 'User'} photo={otherUser?.profile?.profilePhoto ?? null} size="md" />
            <div>
              <div className="font-semibold text-slate-900">{otherUser?.name ?? 'User'}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{directionLabel}</div>
            </div>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${badgeTone}`}>
            {item.status}
          </span>
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {otherUser?.profile?.occupationType ? `Occupation: ${otherUser.profile.occupationType}` : 'Profile available'}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.status === 'PENDING' && isIncoming && (
            <>
              <button onClick={() => onAccept(item.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500">Accept</button>
              <button onClick={() => onReject(item.id)} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400">Reject</button>
            </>
          )}
          {item.status === 'PENDING' && !isIncoming && (
            <span className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Waiting for response</span>
          )}
          {item.status === 'ACCEPTED' && (
            <span className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Connected</span>
          )}
          <button onClick={() => onDelete(item.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Remove</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Section title="Pending" items={grouped.pending} renderCard={renderCard} />
      <Section title="Accepted" items={grouped.accepted} renderCard={renderCard} />
      <Section title="Rejected" items={grouped.rejected} renderCard={renderCard} />
    </div>
  );
}

function AvatarPreview({ name, photo, size = 'md' }: { name: string; photo?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-14 w-14 text-base',
  };

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  if (photo) {
    return <img src={photo} alt={name} className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white shadow-sm`} />;
  }

  return (
    <div className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white shadow-sm`}>
      {initials}
    </div>
  );
}

function Section({ title, items, renderCard }: { title: string; items: ConnectionItem[]; renderCard: (item: ConnectionItem) => JSX.Element }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No {title.toLowerCase()} connections yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{items.map(renderCard)}</div>
      )}
    </section>
  );
}
