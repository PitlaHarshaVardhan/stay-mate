import { useEffect, useState } from 'react';
import {
  Menu,
  X,
  Home,
  Users,
  User,
  Sliders,
  Sparkles,
  MessageSquare,
  LogOut,
  Bell,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  IndianRupee,
  Shield,
  ArrowRight,
  UserCheck,
  Clock,
  Plus,
  Search,
} from 'lucide-react';
import { Link, NavLink, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import ChatPanel from './components/ChatPanel';
import ConnectionBoard from './components/ConnectionBoard';
import LocationAutocomplete from './components/LocationAutocomplete';
import PasswordRecoveryPage from './components/PasswordRecoveryPage';
import Pagination, { PAGE_SIZE } from './components/Pagination';
import { api } from './lib/api';
import type { ConnectionItem, User as UserType } from './types';

function navigationLinkClass(isActive: boolean) {
  return `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
    isActive
      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
  }`;
}

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const navigate = useNavigate();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3800);
  };

  const loadUser = async () => {
    try {
      const response = await api.getCurrentUser();
      const currentUser = response.data?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const [connectionsResponse, notificationsResponse] = await Promise.all([
          api.getConnections().catch(() => ({ data: [] })),
          api.getNotifications().catch(() => ({ data: [] })),
        ]);
        setConnections(connectionsResponse.data ?? []);
        setNotifications(notificationsResponse.data ?? []);
      }
    } catch {
      setUser(null);
      setConnections([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, []);

  const refreshConnections = async () => {
    if (!user) return;
    try {
      const [connectionsResponse, notificationsResponse] = await Promise.all([
        api.getConnections().catch(() => ({ data: [] })),
        api.getNotifications().catch(() => ({ data: [] })),
      ]);
      setConnections(connectionsResponse.data ?? []);
      setNotifications(notificationsResponse.data ?? []);
    } catch {
      // Ignore
    }
  };

  const onAuthSuccess = async () => {
    await loadUser();
    showToast('Logged in successfully! Welcome to StayMate.', 'success');
    navigate('/');
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.updateConnection(connectionId, 'ACCEPTED');
      showToast('Connection request accepted! You can now message each other.', 'success');
      await refreshConnections();
    } catch (err: any) {
      showToast(err.message || 'Could not accept request.', 'error');
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await api.updateConnection(connectionId, 'REJECTED');
      showToast('Connection request rejected.', 'info');
      await refreshConnections();
    } catch (err: any) {
      showToast(err.message || 'Could not reject request.', 'error');
    }
  };

  const handleDelete = async (connectionId: string) => {
    try {
      await api.deleteConnection(connectionId);
      showToast('Connection removed.', 'info');
      await refreshConnections();
    } catch (err: any) {
      showToast(err.message || 'Could not remove connection.', 'error');
    }
  };

  const handleStartChat = async (otherUserId: string) => {
    try {
      await api.createConversation(otherUserId);
      navigate('/messages');
    } catch (err: any) {
      showToast(err.message || 'Could not open chat.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    }
    setUser(null);
    setConnections([]);
    setNotifications([]);
    showToast('Logged out successfully.', 'info');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 animate-bounce">
          <Sparkles size={24} />
        </div>
        <div className="mt-4 text-base font-semibold text-slate-800">Loading StayMate...</div>
        <p className="mt-1 text-xs text-slate-400">Finding your perfect flatmates</p>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 rounded-2xl p-4 shadow-xl text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200/80 shadow-rose-100'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200/80 shadow-indigo-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={18} className="text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Bell size={18} className="text-indigo-600 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
                <Sparkles size={18} />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-700 bg-clip-text text-transparent">
                StayMate
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center justify-end gap-1.5 lg:flex">
              <NavLink to="/" end className={({ isActive }) => navigationLinkClass(isActive)}>
                <Home size={14} /> Home
              </NavLink>
              {user ? (
                <>
                  <NavLink to="/matches" className={({ isActive }) => navigationLinkClass(isActive)}>
                    <Sparkles size={14} /> Matches
                  </NavLink>
                  <NavLink to="/connections" className={({ isActive }) => navigationLinkClass(isActive)}>
                    <Users size={14} /> Connections
                  </NavLink>
                  <NavLink to="/groups" className={({ isActive }) => navigationLinkClass(isActive)}>
                    <Users size={14} /> Groups
                  </NavLink>
                  <NavLink to="/messages" className={({ isActive }) => navigationLinkClass(isActive)}>
                    <MessageSquare size={14} /> Messages
                  </NavLink>
                  <NavLink to="/preferences" className={({ isActive }) => navigationLinkClass(isActive)}>
                    <Sliders size={14} /> Preferences
                  </NavLink>
                  <NavLink to="/profile" className={({ isActive }) => navigationLinkClass(isActive)}>
                    <User size={14} /> Profile
                  </NavLink>

                  {/* User Profile Badge (Prominent on Top) */}
                  <div className="ml-2 flex items-center gap-2 pl-2 border-l border-slate-200">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/90 py-1 pl-1 pr-3 shadow-xs hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                      title="Your profile"
                    >
                      <AvatarPreview
                        name={user.name}
                        photo={user.profile?.profilePhoto}
                        size="sm"
                      />
                      <span className="max-w-36 truncate text-xs font-bold text-slate-800">
                        {user.name}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Logout"
                    >
                      <LogOut size={13} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <NavLink
                    to="/login"
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Log in
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
                  >
                    Get started
                  </NavLink>
                </div>
              )}
            </nav>

            {/* Mobile Top Controls: User Name prominently visible on top! */}
            <div className="flex items-center gap-2 lg:hidden">
              {user && (
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-2.5 shadow-xs"
                >
                  <AvatarPreview name={user.name} photo={user.profile?.profilePhoto} size="sm" />
                  <span className="max-w-28 truncate text-xs font-bold text-slate-800">{user.name}</span>
                </Link>
              )}

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {mobileNavOpen && (
            <div className="mt-3 border-t border-slate-100 pt-3 pb-2 lg:hidden animate-in fade-in slide-in-from-top-2">
              {user && (
                <div className="mb-3 rounded-2xl bg-indigo-50/70 p-3 flex items-center justify-between border border-indigo-100/60">
                  <div className="flex items-center gap-3">
                    <AvatarPreview name={user.name} photo={user.profile?.profilePhoto} size="md" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileNavOpen(false);
                      void handleLogout();
                    }}
                    className="rounded-xl border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600"
                  >
                    Logout
                  </button>
                </div>
              )}

              <nav className="grid grid-cols-2 gap-1.5 text-xs">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) => navigationLinkClass(isActive)}
                >
                  <Home size={14} /> Home
                </NavLink>
                {user ? (
                  <>
                    <NavLink
                      to="/matches"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      <Sparkles size={14} /> Matches
                    </NavLink>
                    <NavLink
                      to="/connections"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      <Users size={14} /> Connections
                    </NavLink>
                    <NavLink
                      to="/groups"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      <Users size={14} /> Groups
                    </NavLink>
                    <NavLink
                      to="/messages"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      <MessageSquare size={14} /> Messages
                    </NavLink>
                    <NavLink
                      to="/preferences"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      <Sliders size={14} /> Preferences
                    </NavLink>
                    <NavLink
                      to="/profile"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      <User size={14} /> Profile
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) => navigationLinkClass(isActive)}
                    >
                      Register
                    </NavLink>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <HomeDashboard
                  user={user}
                  connections={connections}
                  notifications={notifications}
                  onRefresh={refreshConnections}
                  onStartChat={handleStartChat}
                />
              ) : (
                <LandingPage user={user} />
              )
            }
          />

          {/* When logged in, /login and /register redirect to / (Dashboard) cleanly */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" onSuccess={onAuthSuccess} />}
          />

          <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
          <Route path="/reset-password" element={<PasswordRecoveryPage />} />

          <Route
            path="/connections"
            element={
              user ? (
                <ConnectionsPage
                  userId={user.id}
                  connections={connections}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onMessage={handleStartChat}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <ProfilePage user={user} onUserUpdate={loadUser} showToast={showToast} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/preferences"
            element={user ? <PreferencesPage showToast={showToast} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/matches"
            element={
              user ? (
                <MatchingPage
                  userId={user.id}
                  connections={connections}
                  onConnectionCreated={refreshConnections}
                  onStartChat={handleStartChat}
                  showToast={showToast}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/groups"
            element={
              user ? <GroupsPage userId={user.id} showToast={showToast} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/messages"
            element={user ? <ChatPanel user={user} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

/* =========================================================================
   LANDING PAGE (for guests or introduction)
   ========================================================================= */
function LandingPage({ user }: { user: UserType | null }) {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-800 p-8 sm:p-12 text-white shadow-xl shadow-indigo-100">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-100 backdrop-blur-sm">
            <Sparkles size={14} />
            <span>Find your roommate circle before moving</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl leading-tight sm:leading-tight">
            Moving to a new city? Connect with people who match your lifestyle.
          </h1>
          <p className="mt-4 text-base text-indigo-100 sm:text-lg leading-relaxed">
            StayMate brings together prospective roommates by destination city, budget range, move-in timeline, and living preferences.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link
                  to="/matches"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 shadow-md shadow-indigo-900/20 transition hover:bg-indigo-50"
                >
                  <Sparkles size={16} /> Explore matches
                </Link>
                <Link
                  to="/connections"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Users size={16} /> My connections
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 shadow-md shadow-indigo-900/20 transition hover:bg-indigo-50"
                >
                  Get started free <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4 Step Process */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { num: '01', title: 'Set your destination', desc: 'Tell us where you are moving and your expected budget range.' },
          { num: '02', title: 'Share living habits', desc: 'Food preference, cleanliness, sleep schedules, and smoking habits.' },
          { num: '03', title: 'Review compatibility', desc: 'Browse matched profiles with smart percentage compatibility scores.' },
          { num: '04', title: 'Chat & create groups', desc: 'Send connection requests and form apartment hunt roommate groups.' },
        ].map((step) => (
          <div
            key={step.num}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 text-xs">
              {step.num}
            </div>
            <h3 className="mt-3 font-bold text-slate-900 text-base">{step.title}</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function AuthPage({ mode, onSuccess }: { mode: 'login' | 'register'; onSuccess: () => void }) {
  return (
    <div className="mx-auto max-w-md py-4 sm:py-8">
      <AuthForm mode={mode} onSuccess={onSuccess} />
    </div>
  );
}

/* =========================================================================
   HOME DASHBOARD (for authenticated users)
   ========================================================================= */
function HomeDashboard({
  user,
  connections,
  notifications,
  onRefresh,
  onStartChat,
}: {
  user: UserType;
  connections: ConnectionItem[];
  notifications: any[];
  onRefresh: () => Promise<void>;
  onStartChat: (id: string) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const acceptedCount = connections.filter((c) => c.status === 'ACCEPTED').length;
  const pendingCount = connections.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/50 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarPreview name={user.name} photo={user.profile?.profilePhoto} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Member
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                Welcome back, {user.name} 👋
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Manage your roommate connections, search for matches, or chat with prospective flatmates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleRefreshClick()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50 shrink-0"
          >
            <span>{refreshing ? 'Updating...' : 'Refresh data'}</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users size={18} className="text-indigo-600" />}
          label="Total Connections"
          value={connections.length.toString()}
          tone="indigo"
        />
        <StatCard
          icon={<UserCheck size={18} className="text-emerald-600" />}
          label="Connected Roommates"
          value={acceptedCount.toString()}
          tone="emerald"
        />
        <StatCard
          icon={<Clock size={18} className="text-amber-600" />}
          label="Pending Requests"
          value={pendingCount.toString()}
          tone="amber"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Match Explorer',
            desc: 'Find compatible flatmates by city & budget',
            href: '/matches',
            icon: <Sparkles size={20} className="text-indigo-600" />,
            badge: 'Explore',
          },
          {
            label: 'Connection Board',
            desc: 'Review incoming & outgoing roommate requests',
            href: '/connections',
            icon: <Users size={20} className="text-emerald-600" />,
            badge: `${connections.length} items`,
          },
          {
            label: 'Group Rooms',
            desc: 'Join or create move-in apartment groups',
            href: '/groups',
            icon: <Users size={20} className="text-violet-600" />,
            badge: 'Open',
          },
          {
            label: 'Direct Messages',
            desc: 'Chat directly with your accepted connections',
            href: '/messages',
            icon: <MessageSquare size={20} className="text-pink-600" />,
            badge: 'Chat',
          },
        ].map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  {card.badge}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {card.label}
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{card.desc}</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>Open</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Notifications Widget */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900">Recent Notifications</h3>
          </div>
          <Link to="/messages" className="text-xs font-semibold text-indigo-600 hover:underline">
            Go to messages
          </Link>
        </div>

        <div className="mt-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
              No new notifications. You’re all caught up!
            </div>
          ) : (
            notifications.slice(0, 4).map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">{notification.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{notification.message}</div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   CONNECTIONS PAGE
   ========================================================================= */
function ConnectionsPage({
  userId,
  connections,
  onAccept,
  onReject,
  onDelete,
  onMessage,
}: {
  userId: string;
  connections: ConnectionItem[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onMessage: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Roommate Connections</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage connection requests, review incoming inquiries, and message your confirmed flatmate matches.
            </p>
          </div>
        </div>
      </div>

      <ConnectionBoard
        userId={userId}
        items={connections}
        onAccept={onAccept}
        onReject={onReject}
        onDelete={onDelete}
        onMessage={onMessage}
      />
    </div>
  );
}

/* =========================================================================
   PROFILE PAGE
   ========================================================================= */
function ProfilePage({
  user,
  onUserUpdate,
  showToast,
}: {
  user: UserType;
  onUserUpdate: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [form, setForm] = useState({
    profilePhoto: '',
    age: '',
    gender: 'PREFER_NOT_TO_SAY',
    occupationType: 'OTHER',
    college: '',
    company: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.getProfile();
        const data = response.data ?? {};
        setForm({
          profilePhoto: data.profilePhoto ?? '',
          age: data.age !== undefined && data.age !== null ? String(data.age) : '',
          gender: data.gender ?? 'PREFER_NOT_TO_SAY',
          occupationType: data.occupationType ?? 'OTHER',
          college: data.college ?? '',
          company: data.company ?? '',
          bio: data.bio ?? '',
        });
      } catch {
        // Leave defaults
      }
    })();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.saveProfile({
        profilePhoto: form.profilePhoto,
        age: form.age === '' ? undefined : Number(form.age),
        gender: form.gender,
        occupationType: form.occupationType,
        college: form.college.trim(),
        company: form.company.trim(),
        bio: form.bio.trim(),
      });
      await onUserUpdate();
      showToast('Profile updated successfully! Your picture & details are live.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPEG, PNG, WebP).');
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Image must be under 8 MB.');
      event.target.value = '';
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 384 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing is unavailable in this browser.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const compressedPhoto = canvas.toDataURL('image/jpeg', 0.72);
      if (compressedPhoto.length > 900_000) {
        throw new Error('This image is too large even after compression. Please try another image.');
      }
      setForm((current) => ({ ...current, profilePhoto: compressedPhoto }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Could not read this image.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <User size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Profile</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Keep your profile up to date so potential roommates know who you are.
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        {/* Photo Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <AvatarPreview name={user.name} photo={form.profilePhoto} size="lg" />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="profile-photo">
              Profile Photo
            </label>
            <input
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void onPhotoSelected(event)}
              className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-1.5 file:font-semibold file:text-indigo-600 file:shadow-xs hover:file:bg-indigo-50"
            />
            {form.profilePhoto && (
              <button
                type="button"
                onClick={() => setForm((curr) => ({ ...curr, profilePhoto: '' }))}
                className="mt-1.5 text-xs font-semibold text-rose-600 hover:underline"
              >
                Remove photo
              </button>
            )}
            {photoError && <p className="mt-1 text-xs text-rose-600">{photoError}</p>}
          </div>
        </div>

        {/* Age & Gender */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Age
            </label>
            <input
              type="number"
              min="18"
              max="80"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              placeholder="e.g. 24"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Gender
            </label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Occupation & College */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Occupation
            </label>
            <select
              value={form.occupationType}
              onChange={(e) => setForm({ ...form, occupationType: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="STUDENT">Student</option>
              <option value="EMPLOYEE">Working Professional</option>
              <option value="INTERN">Intern</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              College / University
            </label>
            <input
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              placeholder="e.g. IIT Delhi, BITS Pilani"
            />
          </div>
        </div>

        {/* Company */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Company / Employer
          </label>
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            placeholder="e.g. Google, Microsoft, Startup"
          />
        </div>

        {/* Bio with Live Character Counter */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Short Bio
            </label>
            <span
              className={`text-xs ${
                form.bio.length > 240 ? 'font-bold text-amber-600' : 'text-slate-400'
              }`}
            >
              {form.bio.length}/250 characters
            </span>
          </div>
          <textarea
            maxLength={250}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none leading-relaxed"
            placeholder="Write a brief introduction about your schedule, hobbies, or what you appreciate in flatmates..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

/* =========================================================================
   PREFERENCES PAGE
   ========================================================================= */
function PreferencesPage({
  showToast,
}: {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [form, setForm] = useState({
    city: '',
    area: '',
    budgetMin: 8000,
    budgetMax: 20000,
    moveInDate: '',
    roomType: 'ANY',
    roommatesRequired: 1,
    smokingPreference: 'NO_PREFERENCE',
    drinkingPreference: 'NO_PREFERENCE',
    foodPreference: 'ANY',
    sleepSchedule: 'FLEXIBLE',
    cleanlinessPreference: 'MEDIUM',
    genderPreference: 'ANY',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.getPreferences();
        const data = response.data;
        if (data) {
          setForm({
            city: data.city ?? '',
            area: data.area ?? '',
            budgetMin: data.budgetMin ?? 8000,
            budgetMax: data.budgetMax ?? 20000,
            moveInDate: data.moveInDate ? new Date(data.moveInDate).toISOString().slice(0, 10) : '',
            roomType: data.roomType ?? 'ANY',
            roommatesRequired: data.roommatesRequired ?? 1,
            smokingPreference: data.smokingPreference ?? 'NO_PREFERENCE',
            drinkingPreference: data.drinkingPreference ?? 'NO_PREFERENCE',
            foodPreference: data.foodPreference ?? 'ANY',
            sleepSchedule: data.sleepSchedule ?? 'FLEXIBLE',
            cleanlinessPreference: data.cleanlinessPreference ?? 'MEDIUM',
            genderPreference: data.genderPreference ?? 'ANY',
          });
        }
      } catch {
        // Leave defaults
      }
    })();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.city.trim() || form.city.trim().length < 2) {
      showToast('Please search for a place and select a destination city from the suggestions.', 'error');
      return;
    }
    if (!form.area.trim() || form.area.trim().length < 2) {
      showToast('Please search for a place and select a locality or area from the suggestions.', 'error');
      return;
    }
    if (Number(form.budgetMax) < Number(form.budgetMin)) {
      showToast('Budget max should be greater than or equal to budget min.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.savePreferences({
        ...form,
        city: form.city.trim(),
        area: form.area.trim(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        roommatesRequired: Number(form.roommatesRequired),
        moveInDate: form.moveInDate ? new Date(form.moveInDate).toISOString() : new Date().toISOString(),
      });
      showToast('Living preferences saved successfully! Matches updated.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Could not save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Sliders size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Living Preferences</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Set your target city, budget constraints, room types, and roommate compatibility filters.
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        {/* City & Area */}
        <div className="grid gap-4 sm:grid-cols-2">
          <LocationAutocomplete
            onSelect={({ city, area }) => setForm((current) => ({ ...current, city, area }))}
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Destination City *
            </label>
            <input
              required
              readOnly
              value={form.city}
              placeholder="Filled from the place you select above"
              className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Locality / Area *
            </label>
            <input
              required
              readOnly
              value={form.area}
              placeholder="Filled from the place you select above"
              className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Search a place above and pick a result from the list — City and Area are filled automatically and can't be edited by hand.
          </p>
        </div>

        {/* Budget */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Budget Min (₹)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Budget Max (₹)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Move in Date & Room Type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Move-in Date
            </label>
            <input
              type="date"
              value={form.moveInDate}
              onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Room Sharing Preference
            </label>
            <select
              value={form.roomType}
              onChange={(e) => setForm({ ...form, roomType: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="ANY">Any Room Type</option>
              <option value="SINGLE">Single Private Room</option>
              <option value="DOUBLE">Double Sharing</option>
              <option value="TRIPLE">Triple Sharing</option>
              <option value="FOUR_PLUS">Four Plus Sharing</option>
            </select>
          </div>
        </div>

        {/* Roommates & Gender */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Roommates Required
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={form.roommatesRequired}
              onChange={(e) => setForm({ ...form, roommatesRequired: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Preferred Roommate Gender
            </label>
            <select
              value={form.genderPreference}
              onChange={(e) => setForm({ ...form, genderPreference: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="ANY">Any Gender</option>
              <option value="MALE">Male Only</option>
              <option value="FEMALE">Female Only</option>
            </select>
          </div>
        </div>

        {/* Lifestyle: Smoking & Drinking */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Smoking Preference
            </label>
            <select
              value={form.smokingPreference}
              onChange={(e) => setForm({ ...form, smokingPreference: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="NO_PREFERENCE">No Preference</option>
              <option value="NON_SMOKER">Non-Smoker Only</option>
              <option value="SMOKER">Smoker Friendly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Drinking Preference
            </label>
            <select
              value={form.drinkingPreference}
              onChange={(e) => setForm({ ...form, drinkingPreference: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="NO_PREFERENCE">No Preference</option>
              <option value="NON_DRINKER">Non-Drinker Only</option>
              <option value="DRINKER">Drinker Friendly</option>
            </select>
          </div>
        </div>

        {/* Food & Sleep */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Diet / Food
            </label>
            <select
              value={form.foodPreference}
              onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="ANY">Any Diet</option>
              <option value="VEG">Vegetarian Only</option>
              <option value="NON_VEG">Non-Vegetarian</option>
              <option value="VEGAN">Vegan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Sleep Schedule
            </label>
            <select
              value={form.sleepSchedule}
              onChange={(e) => setForm({ ...form, sleepSchedule: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="FLEXIBLE">Flexible / Moderate</option>
              <option value="EARLY">Early Bird (Sleep early)</option>
              <option value="LATE">Night Owl (Sleep late)</option>
            </select>
          </div>
        </div>

        {/* Cleanliness */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Cleanliness Standard
          </label>
          <select
            value={form.cleanlinessPreference}
            onChange={(e) => setForm({ ...form, cleanlinessPreference: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="LOW">Relaxed</option>
            <option value="MEDIUM">Balanced / Standard</option>
            <option value="HIGH">Very Clean & Tidy</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving preferences...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}

/* =========================================================================
   MATCHING PAGE
   ========================================================================= */
function MatchingPage({
  userId,
  connections,
  onConnectionCreated,
  onStartChat,
  showToast,
}: {
  userId: string;
  connections: ConnectionItem[];
  onConnectionCreated: () => Promise<void>;
  onStartChat: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsPreferences, setNeedsPreferences] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchPage, setMatchPage] = useState(1);

  useEffect(() => {
    void (async () => {
      try {
        const preferenceResponse = await api.getPreferences();
        if (!preferenceResponse.data) {
          setNeedsPreferences(true);
          setMatches([]);
          return;
        }

        setNeedsPreferences(false);
        const response = await api.getMatchingPeople();
        const data = response.data ?? [];
        setMatches(data);
      } catch (error) {
        setMatches([]);
        setSelectedMatchId(null);
        setLoadError(error instanceof Error ? error.message : 'Could not load matches.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Popup behavior: Escape closes the detail popup and the page behind it
  // stays fixed while it is open.
  useEffect(() => {
    if (!selectedMatchId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedMatchId(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedMatchId]);

  // The detail view is a popup: it only opens when a candidate is clicked.
  const selectedMatch = selectedMatchId
    ? matches.find((match) => match.user.id === selectedMatchId) ?? null
    : null;
  const totalMatchPages = Math.ceil(matches.length / PAGE_SIZE);
  const currentMatchPage = Math.min(matchPage, Math.max(1, totalMatchPages));
  const visibleMatches = matches.slice((currentMatchPage - 1) * PAGE_SIZE, currentMatchPage * PAGE_SIZE);

  const existingConnection = selectedMatch
    ? connections.find(
        (connection) =>
          (connection.senderId === userId && connection.receiverId === selectedMatch.user.id) ||
          (connection.senderId === selectedMatch.user.id && connection.receiverId === userId),
      )
    : undefined;

  const isOutgoingRequest = existingConnection?.senderId === userId;

  const sendConnectionRequest = async () => {
    if (!selectedMatch || existingConnection || sendingRequest) return;

    setSendingRequest(true);
    try {
      await api.createConnection(selectedMatch.user.id);
      showToast(`Connection request sent to ${selectedMatch.user.name}!`, 'success');
      await onConnectionCreated();
    } catch (error: any) {
      showToast(error.message || 'Could not send request.', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Roommate Recommendations</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Profiles ranked by compatibility with your destination, budget, room preferences, and lifestyle habits.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-white p-8 text-slate-500 border border-slate-200/80">
          <Sparkles className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
          <span>Searching for compatible flatmates...</span>
        </div>
      ) : needsPreferences ? (
        <div className="rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <Sliders size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Set your living preferences first</h3>
          <p className="mt-2 mx-auto max-w-md text-sm text-slate-500 leading-relaxed">
            Please tell us your destination city, budget range, and room preferences so we can compute compatibility scores.
          </p>
          <Link
            to="/preferences"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
          >
            Enter preferences <ArrowRight size={16} />
          </Link>
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {loadError}
        </div>
      ) : (
        <div>
          {/* Matches List */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 sm:col-span-2">
                  No roommates are available to show yet. Once other people set their preferences, they'll appear here — those that don't share your city, budget, or gender requirements are listed as "Not a match".
                </div>
              ) : (
                visibleMatches.map((match) => {
                  const isSelected = selectedMatch?.user?.id === match.user.id;
                  return (
                    <button
                      key={match.user.id}
                      type="button"
                      onClick={() => setSelectedMatchId(match.user.id)}
                      className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 text-left shadow-xs transition-all duration-200 ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                          : 'border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <AvatarPreview
                              name={match.user.name}
                              photo={match.profile?.profilePhoto}
                              size="md"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                {match.user.name}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">
                                {match.profile?.occupationType ?? 'Profile available'}
                              </p>
                            </div>
                          </div>

                          {match.eligible ? (
                            match.compatibilityScore !== null ? (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                                {match.compatibilityScore}% match
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200/60">
                                Not enough data
                              </span>
                            )
                          ) : match.compatibilityScore !== null ? (
                            <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200/60">
                              {match.compatibilityScore}% match
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200/60">
                              Not a match
                            </span>
                          )}
                        </div>
                        <p className="mt-1 pl-[3.25rem] text-[11px] text-slate-500">
                          {match.comparedCount}/{match.totalCriteria} preferences compared
                          {matchingCriteria(match).length > 0 && (
                            <span className="ml-1 font-semibold text-emerald-600">
                              · {matchingCriteria(match).length} in common
                            </span>
                          )}
                        </p>

                        <p className="mt-3 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                          {match.profile?.bio ?? 'Looking for a friendly and compatible roommate.'}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin size={12} className="text-indigo-600" />
                          {match.preference.city}
                        </span>
                        <span className="font-semibold text-slate-900">
                          ₹{match.preference.budgetMin} - ₹{match.preference.budgetMax}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <Pagination
              page={currentMatchPage}
              totalItems={matches.length}
              onPageChange={(page) => {
                setMatchPage(page);
              }}
              label="Match recommendations"
            />
          </div>

        </div>
      )}

      {/* Selected Match Detail Popup */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Profile details for ${selectedMatch.user.name}`}
          onClick={() => setSelectedMatchId(null)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedMatchId(null)}
              aria-label="Close profile details"
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <div>
                <div className="flex items-center gap-4">
                  <AvatarPreview
                    name={selectedMatch.user.name}
                    photo={selectedMatch.profile?.profilePhoto}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedMatch.user.name}</h3>
                    <p className="text-xs text-slate-500">
                      {selectedMatch.profile?.occupationType ?? 'Flatmate candidate'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  {selectedMatch.eligible ? (
                    selectedMatch.compatibilityScore !== null ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200/60">
                        {selectedMatch.compatibilityScore}% compatibility
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200/60">
                        Not enough data to score yet
                      </span>
                    )
                  ) : selectedMatch.compatibilityScore !== null ? (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 border border-rose-200/60">
                      {selectedMatch.compatibilityScore}% compatibility
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 border border-rose-200/60">
                      Not a match
                    </span>
                  )}
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 border border-indigo-200/60">
                    {selectedMatch.preference.city}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {selectedMatch.preference.roomType}
                  </span>
                </div>

                {!selectedMatch.eligible && selectedMatch.incompatibilityReasons?.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-xs text-rose-700">
                    <p className="font-bold text-rose-800">Why this isn't a match</p>
                    <ul className="mt-1.5 space-y-1 leading-relaxed">
                      {selectedMatch.incompatibilityReasons.map((reason: string) => (
                        <li key={reason} className="flex gap-1.5">
                          <span aria-hidden="true">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-white/90 p-4 text-xs text-slate-600 border border-slate-100 shadow-xs leading-relaxed">
                  {selectedMatch.profile?.bio ?? 'Looking for a compatible roommate match.'}
                </div>

                <div className="mt-4 space-y-2.5 rounded-2xl bg-white/60 p-4 border border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Move-in Date:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedMatch.preference.moveInDate
                        ? new Date(selectedMatch.preference.moveInDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Flexible'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Budget Range:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{selectedMatch.preference.budgetMin} - ₹{selectedMatch.preference.budgetMax}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Diet Preference:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedMatch.preference.foodPreference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Smoking:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedMatch.preference.smokingPreference}
                    </span>
                  </div>
                </div>

                <CompatibilityBreakdown match={selectedMatch} />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                {existingConnection?.status === 'ACCEPTED' ? (
                  <button
                    type="button"
                    onClick={() => onStartChat(selectedMatch.user.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                  >
                    <MessageSquare size={16} /> Message {selectedMatch.user.name}
                  </button>
                ) : existingConnection?.status === 'PENDING' && !isOutgoingRequest ? (
                  <Link
                    to="/connections"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
                  >
                    Review incoming request
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void sendConnectionRequest()}
                    disabled={sendingRequest || Boolean(existingConnection)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {sendingRequest ? (
                      <span>Sending request...</span>
                    ) : existingConnection?.status === 'PENDING' ? (
                      <span>Request pending</span>
                    ) : existingConnection ? (
                      <span>Request sent</span>
                    ) : (
                      <>
                        <Users size={16} />
                        <span>Send connection request</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

/* Criteria that were compared AND scored well — the shared common ground
   between the current user and a candidate. Used to highlight what's matching
   for everyone, including people who are not an overall match. */
const MATCHING_SCORE_THRESHOLD = 70;
function matchingCriteria(match: any): any[] {
  return ((match?.breakdown as any[]) ?? []).filter(
    (component) => component.score !== null && component.score >= MATCHING_SCORE_THRESHOLD,
  );
}

function CompatibilityBreakdown({ match }: { match: any }) {
  const scoreLabel = (score: number | null) => {
    if (score === null) return 'Not compared';
    if (score >= 85) return 'Strong alignment';
    if (score >= 70) return 'Good potential';
    if (score >= 50) return 'Some differences';
    return 'Low alignment';
  };

  const matchingComponents = matchingCriteria(match);

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900">
          {match.eligible ? 'Why this match' : 'Preference comparison'}
        </h4>
        <span className="text-[11px] text-slate-500">{match.comparedCount}/{match.totalCriteria} compared · {match.coveragePercent}% coverage</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Version {match.algorithmVersion} · Preference alignment, not a prediction of roommate success.
      </p>

      {/* Always surface the common ground — even for people who are not an
          overall match (e.g. different city). A criterion counts as matching
          when it was compared and scored well, consistent with the per-criterion
          labels below (>= 70 = "Good potential"). */}
      {matchingComponents.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-emerald-200/60 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <h5 className="text-sm font-bold text-emerald-800">
              What's matching ({matchingComponents.length})
            </h5>
          </div>
          <ul className="mt-2 space-y-1.5">
            {matchingComponents.map((component: any) => (
              <li key={component.key} className="flex items-start gap-2 text-xs text-emerald-800">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-4">
                  <span className="font-semibold">{component.label}:</span> {component.explanation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <span className="leading-4">
            No shared preferences scored highly yet. The full comparison is below — anything not listed as matching may still be close or worth a conversation.
          </span>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {match.breakdown.map((component: any) => (
          <div key={component.key}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800">
                {component.label} <span className="font-normal text-slate-400">{component.weight}%</span>
              </span>
              <span className="shrink-0 text-slate-600">
                {component.score === null ? 'Not compared' : `${component.score}% · ${scoreLabel(component.score)}`}
              </span>
            </div>
            {component.score !== null && (
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${component.score}%` }} />
              </div>
            )}
            <p className="mt-1 text-[11px] leading-4 text-slate-500">{component.explanation}</p>
          </div>
        ))}
      </div>

      {match.notes.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          {match.notes.map((note: string) => <p key={note} className="text-[11px] leading-4 text-amber-800">{note}</p>)}
        </div>
      )}
    </section>
  );
}

/* =========================================================================
   GROUPS PAGE
   ========================================================================= */
function GroupsPage({
  userId,
  showToast,
}: {
  userId: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [groupsPage, setGroupsPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    area: '',
    budgetMin: 10000,
    budgetMax: 20000,
    moveInDate: '',
    targetMembers: 4,
    description: '',
  });

  const loadGroups = async () => {
    try {
      const response = await api.getGroups();
      setGroups(response.data ?? []);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, [userId]);

  const filteredGroups = groups.filter((group) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return [group.name, group.city, group.area, group.description].some((value) =>
      String(value ?? '').toLowerCase().includes(term),
    );
  });

  const totalGroupPages = Math.ceil(filteredGroups.length / PAGE_SIZE);
  const currentGroupPage = Math.min(groupsPage, Math.max(1, totalGroupPages));
  const visibleGroups = filteredGroups.slice(
    (currentGroupPage - 1) * PAGE_SIZE,
    currentGroupPage * PAGE_SIZE,
  );

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      showToast('Group name must be at least 2 characters.', 'error');
      return;
    }
    if (!form.city.trim() || form.city.trim().length < 2) {
      showToast('Search for a place and select a destination city from the suggestions.', 'error');
      return;
    }
    if (!form.area.trim() || form.area.trim().length < 2) {
      showToast('Search for a place and select a locality or area from the suggestions.', 'error');
      return;
    }

    setCreating(true);
    try {
      await api.createGroup({
        name: form.name.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        moveInDate: new Date(form.moveInDate || Date.now()).toISOString(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        targetMembers: Number(form.targetMembers),
        description: form.description.trim(),
      });
      setForm({
        name: '',
        city: '',
        area: '',
        budgetMin: 10000,
        budgetMax: 20000,
        moveInDate: '',
        targetMembers: 4,
        description: '',
      });
      await loadGroups();
      showToast('Roommate group created successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Could not create group.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const onJoin = async (groupId: string) => {
    try {
      await api.joinGroup(groupId);
      await loadGroups();
      showToast('Join request submitted to group owner!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Could not join group.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Roommate Groups</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Form or join co-living groups moving to the same neighborhood and share a house together.
            </p>
          </div>
        </div>
      </div>

      {/* Create Group Form */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900">Create a New Group</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Start a team to house-hunt together for flats or apartments.
        </p>

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onCreate}>
          <LocationAutocomplete
            onSelect={({ city, area }) => setForm((current) => ({ ...current, city, area }))}
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Group Name *
            </label>
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              placeholder="e.g. Madhapur Techies Flat"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Destination City *
            </label>
            <input
              required
              readOnly
              value={form.city}
              placeholder="Filled from the place you select above"
              className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Locality / Area *
            </label>
            <input
              required
              readOnly
              value={form.area}
              placeholder="Filled from the place you select above"
              className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Move-in Date
            </label>
            <input
              type="date"
              value={form.moveInDate}
              onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Individual Budget Min (₹)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Individual Budget Max (₹)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Total Members (2 to 10)
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={form.targetMembers}
              onChange={(e) => setForm({ ...form, targetMembers: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Group Description & Flat Preferences
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              placeholder="Tell others what kind of flat you're seeking (e.g. 3BHK, fully furnished, close to metro)..."
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creating group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>

      {/* Available Groups List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Active Groups</h3>
            <p className="mt-0.5 text-xs text-slate-500">Join existing groups looking for additional roommates.</p>
          </div>
          <div className="relative sm:max-w-xs w-full">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setGroupsPage(1);
              }}
              placeholder="Filter by city, area, or name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400 sm:col-span-2">
              No matching groups found. Create one above to get started!
            </div>
          ) : (
            visibleGroups.map((group) => {
              const isOwner = group.ownerId === userId;
              const isMember = (group.members ?? []).some(
                (m: any) => m.userId === userId || m.user?.id === userId,
              );
              const isFull = (group.members ?? []).length >= group.targetMembers;

              return (
                <div
                  key={group.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-4 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-base truncate">{group.name}</h4>
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm shrink-0">
                        {group.members?.length ?? 1}/{group.targetMembers} members
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-100">
                      <MapPin size={12} />
                      <span>
                        {group.city}, {group.area}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {group.description || 'Looking for compatible roommates to share an apartment.'}
                      </p>

                      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 text-xs text-slate-600 border border-slate-100">
                        <span>Budget: ₹{group.budgetMin} - ₹{group.budgetMax}</span>
                        <span>
                          {group.moveInDate
                            ? new Date(group.moveInDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Flexible'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {isOwner ? (
                        <div className="rounded-xl bg-indigo-50 p-2.5 text-center text-xs font-semibold text-indigo-700 border border-indigo-100">
                          Your Group (Admin)
                        </div>
                      ) : isMember ? (
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-semibold text-emerald-700 border border-emerald-100">
                          Joined Member
                        </div>
                      ) : isFull ? (
                        <div className="rounded-xl bg-slate-100 p-2.5 text-center text-xs font-semibold text-slate-500">
                          Group Full
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onJoin(group.id)}
                          className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                          Request to join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-2">
          <Pagination
            page={currentGroupPage}
            totalItems={filteredGroups.length}
            onPageChange={setGroupsPage}
            label="Groups"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   AVATAR PREVIEW COMPONENT
   ========================================================================= */
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
        className={`${sizeMap[size]} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm`}
        onError={(event) => {
          const target = event.currentTarget as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm`}
    >
      {initials}
    </div>
  );
}

/* =========================================================================
   STAT CARD COMPONENT
   ========================================================================= */
function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'indigo' | 'emerald' | 'amber';
}) {
  const tones = {
    indigo: 'bg-indigo-50/70 border-indigo-100',
    emerald: 'bg-emerald-50/70 border-emerald-100',
    amber: 'bg-amber-50/70 border-amber-100',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-xs transition hover:shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}
