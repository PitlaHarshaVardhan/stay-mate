import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, RefreshCw, Send, User } from 'lucide-react';
import { api } from '../lib/api';
import Pagination, { PAGE_SIZE } from './Pagination';
import { Button, Heading, InlineText, Paragraph, TextInput } from './ui';

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
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState('');
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
    let active = true;
    if (!selectedConversationId) {
      setMessages([]);
      setMessagesError('');
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);
    setMessagesError('');
    void (async () => {
      try {
        const response = await api.getConversation(selectedConversationId);
        if (active) setMessages(response.data?.messages ?? []);
      } catch {
        if (active) setMessagesError('Could not load messages. Please refresh and try again.');
      } finally {
        if (active) setMessagesLoading(false);
      }
    })();

    return () => {
      active = false;
    };
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
    try {
      await loadConversations();
      if (selectedConversationId) {
        setMessagesLoading(true);
        setMessagesError('');
        try {
          const response = await api.getConversation(selectedConversationId);
          setMessages(response.data?.messages ?? []);
        } catch {
          setMessagesError('Could not load messages. Please refresh and try again.');
        } finally {
          setMessagesLoading(false);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !draft.trim()) return;

    const content = draft.trim();
    setDraft('');

    try {
      await api.sendMessage(selectedConversationId, content);
      const response = await api.getConversation(selectedConversationId);
      setMessages(response.data?.messages ?? []);
      setMessagesError('');
      await loadConversations();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not send message.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-200">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
        <InlineText>Loading messages...</InlineText>
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
            <Heading level={2} className="text-lg font-bold text-slate-900">Chats</Heading>
          </div>
          <Button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            variant="secondary"
            size="xs"
            className="text-slate-600"
            title="Refresh conversations"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <InlineText>Refresh</InlineText>
          </Button>
        </div>

        <div className="flex-1 space-y-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              <MessageSquare size={24} className="mb-2 text-slate-300" />
              <InlineText>No conversations yet. Connect with a roommate to start chatting!</InlineText>
            </div>
          ) : (
            visibleConversations.map((conversation) => {
              const other = (conversation.members ?? []).find((m: any) => m.userId !== user.id)?.user;
              const title = other?.name ?? 'Direct Chat';
              const lastMessage = conversation.messages?.[0]?.content ?? 'Conversation started';
              const isSelected = selectedConversationId === conversation.id;

              return (
                <Button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    if (conversation.id !== selectedConversationId) {
                      setMessagesLoading(true);
                      setMessagesError('');
                      setSelectedConversationId(conversation.id);
                    }
                  }}
                  variant="conversation"
                  selected={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-xs text-sm">
                      {title.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <InlineText className="truncate font-semibold text-slate-900 text-sm">{title}</InlineText>
                      </div>
                      <Paragraph className="mt-0.5 truncate text-xs text-slate-500">{lastMessage}</Paragraph>
                    </div>
                  </div>
                </Button>
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
                  <Heading level={3} className="font-bold text-slate-900 text-base leading-tight">
                    {otherMembers.length > 0
                      ? otherMembers.map((member: any) => member.user?.name ?? 'User').join(', ')
                      : 'Conversation'}
                  </Heading>
                  <InlineText className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <InlineText className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></InlineText>
                    <InlineText>{selectedConversation.type === 'DIRECT' ? 'Active Chat' : 'Group Room'}</InlineText>
                  </InlineText>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-4 border border-slate-100 max-h-[420px]">
                {messagesLoading ? (
                  <div role="status" className="flex h-48 items-center justify-center text-xs text-slate-400">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin text-indigo-600" />
                    <InlineText>Loading chat messages...</InlineText>
                  </div>
                ) : messagesError ? (
                  <div role="alert" className="flex h-48 items-center justify-center text-center text-xs text-rose-600">
                    {messagesError}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-slate-400">
                    <MessageSquare size={32} className="mb-2 text-slate-300" />
                    <InlineText>No messages yet. Send a message to say hello!</InlineText>
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
                            <Paragraph>{message.content}</Paragraph>
                            <InlineText
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
                            </InlineText>
                          </div>
                        </div>
                      );
                    })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <TextInput
                  variant="chat"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                />
                <Button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!draft.trim()}
                  variant="primary"
                  size="icon"
                  className="shrink-0"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center text-slate-400">
            <MessageSquare size={44} className="mb-3 text-slate-300" />
            <Heading level={4} className="text-base font-semibold text-slate-700">No conversation selected</Heading>
            <Paragraph className="mt-1 text-xs text-slate-500">Pick a chat from the sidebar or connect with new roommates.</Paragraph>
          </div>
        )}
      </section>
    </div>
  );
}
