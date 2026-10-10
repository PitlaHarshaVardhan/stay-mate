import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, RefreshCw, Send, User } from 'lucide-react';
import { api } from '../lib/api';
import Pagination, { PAGE_SIZE } from './Pagination';

type ChatUser = {
  id: string;
  name: string;
  email?: string;
  profile?: {
    profilePhoto?: string | null;
  } | null;
};

type ChatProps = {
  user: ChatUser;
  initialConversationId?: string | null;
};

export default function ChatPanel({ user, initialConversationId }: ChatProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    try {
      const response = await api.getConversations();
      const items = response.data ?? [];
      setConversations(items);
      if (items.length > 0 && (!selectedConversationId || !items.some((item) => item.id === selectedConversationId))) {
        setSelectedConversationId(initialConversationId ?? items[0].id);
      }
    } catch {
      setConversations([]);
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
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    void (async () => {
      try {
        const response = await api.getConversation(selectedConversationId);
        setMessages(response.data?.messages ?? []);
      } catch {
        setMessages([]);
      }
    })();
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const totalConversationPages = Math.ceil(conversations.length / PAGE_SIZE);
  const currentConversationPage = Math.min(conversationPage, Math.max(1, totalConversationPages));
  const visibleConversations = conversations.slice(
    (currentConversationPage - 1) * PAGE_SIZE,
    currentConversationPage * PAGE_SIZE,
  );

  const otherMembers = useMemo(() => {
    if (!selectedConversation) return [];
    return (selectedConversation.members ?? []).filter((member: any) => member.userId !== user.id);
  }, [selectedConversation, user.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    if (selectedConversationId) {
      const response = await api.getConversation(selectedConversationId);
      setMessages(response.data?.messages ?? []);
    }
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !draft.trim()) return;

    const content = draft.trim();
    setDraft('');

    try {
      await api.sendMessage(selectedConversationId, content);
      const response = await api.getConversation(selectedConversationId);
      setMessages(response.data?.messages ?? []);
      await loadConversations();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not send message.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-200">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
        <span>Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <MessageSquare size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Chats</h2>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh conversations"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex-1 space-y-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              <MessageSquare size={24} className="mb-2 text-slate-300" />
              <span>No conversations yet. Connect with a roommate to start chatting!</span>
            </div>
          ) : (
            visibleConversations.map((conversation) => {
              const other = (conversation.members ?? []).find((m: any) => m.userId !== user.id)?.user;
              const title = other?.name ?? 'Direct Chat';
              const lastMessage = conversation.messages?.[0]?.content ?? 'Conversation started';
              const isSelected = selectedConversationId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-2xl p-3 text-left transition-all duration-150 ${
                    isSelected
                      ? 'border border-indigo-200 bg-indigo-50/80 shadow-sm'
                      : 'border border-transparent bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-xs text-sm">
                      {title.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold text-slate-900 text-sm">{title}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{lastMessage}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-2 border-t border-slate-100">
          <Pagination
            page={currentConversationPage}
            totalItems={conversations.length}
            onPageChange={setConversationPage}
            label="Conversations"
          />
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex min-h-[500px] flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {selectedConversation ? (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-xs text-sm">
                  {otherMembers[0]?.user?.name ? otherMembers[0].user.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {otherMembers.length > 0
                      ? otherMembers.map((member: any) => member.user?.name ?? 'User').join(', ')
                      : 'Conversation'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{selectedConversation.type === 'DIRECT' ? 'Active Chat' : 'Group Room'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-4 border border-slate-100 max-h-[420px]">
                {messages.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-slate-400">
                    <MessageSquare size={32} className="mb-2 text-slate-300" />
                    <span>No messages yet. Send a message to say hello!</span>
                  </div>
                ) : (
                  messages
                    .slice()
                    .reverse()
                    .map((message: any) => {
                      const isMine = message.senderId === user.id;
                      return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                            }`}
                          >
                            <p>{message.content}</p>
                            <span
                              className={`mt-1 block text-[10px] text-right ${
                                isMine ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              {message.createdAt
                                ? new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!draft.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center text-slate-400">
            <MessageSquare size={44} className="mb-3 text-slate-300" />
            <h4 className="text-base font-semibold text-slate-700">No conversation selected</h4>
            <p className="mt-1 text-xs text-slate-500">Pick a chat from the sidebar or connect with new roommates.</p>
          </div>
        )}
      </section>
    </div>
  );
}
