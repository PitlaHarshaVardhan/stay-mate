import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type ChatUser = {
  id: string;
  name: string;
  email?: string;
};

type ChatProps = {
  user: ChatUser;
};

export default function ChatPanel({ user }: ChatProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    const response = await api.getConversations();
    const items = response.data ?? [];
    setConversations(items);
    if (items.length > 0 && (!selectedConversationId || !items.some((item) => item.id === selectedConversationId))) {
      setSelectedConversationId(items[0].id);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        await loadConversations();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    void (async () => {
      const response = await api.getConversation(selectedConversationId);
      setMessages(response.data?.messages ?? []);
    })();
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const otherMembers = useMemo(() => {
    if (!selectedConversation) return [];
    return (selectedConversation.members ?? []).filter((member: any) => member.userId !== user.id);
  }, [selectedConversation, user.id]);

  const sendMessage = async () => {
    if (!selectedConversationId || !draft.trim()) return;

    await api.sendMessage(selectedConversationId, draft.trim());
    setDraft('');
    const response = await api.getConversation(selectedConversationId);
    setMessages(response.data?.messages ?? []);
    await loadConversations();
  };

  if (loading) {
    return <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading conversations...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Messages</h2>
          <button onClick={() => void loadConversations()} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">Refresh</button>
        </div>

        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No conversations yet.</div>
          ) : (
            conversations.map((conversation) => {
              const conversationUsers = (conversation.members ?? []).map((member: any) => member.user?.name ?? 'User').filter(Boolean);
              const recipients = conversationUsers.filter((name: string) => name !== user.name).join(', ') || 'Direct chat';
              const lastMessage = conversation.messages?.[0]?.content ?? 'New chat';

              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedConversationId === conversation.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <div className="font-semibold text-slate-900">{recipients}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-slate-600">{lastMessage}</div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        {selectedConversation ? (
          <>
            <div className="mb-4 border-b border-slate-200 pb-3">
              <h3 className="text-xl font-bold text-slate-900">
                {otherMembers.length > 0 ? otherMembers.map((member: any) => member.user?.name ?? 'User').join(', ') : 'Conversation'}
              </h3>
              <p className="text-sm text-slate-500">{selectedConversation.type === 'DIRECT' ? 'Direct message' : 'Group chat'}</p>
            </div>

            <div className="flex min-h-[360px] flex-col">
              <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-slate-500">No messages yet. Start the conversation.</div>
                ) : (
                  messages
                    .slice()
                    .reverse()
                    .map((message: any) => {
                      const isMine = message.senderId === user.id;
                      return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'}`}>
                            {message.content}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Write a message..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
                <button onClick={() => void sendMessage()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">Select a conversation.</div>
        )}
      </section>
    </div>
  );
}
