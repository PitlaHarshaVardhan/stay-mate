import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import ChatPanel from './components/ChatPanel';
import ConnectionBoard from './components/ConnectionBoard';
import { api } from './lib/api';
import type { ConnectionItem, User } from './types';

function navigationLinkClass(isActive: boolean) {
  return `rounded-full px-3 py-1.5 font-medium transition ${isActive
    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const loadUser = async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(response.data?.user ?? null);
      if (response.data?.user) {
        const [connectionsResponse, notificationsResponse] = await Promise.all([
          api.getConnections(),
          api.getNotifications().catch(() => ({ data: [] })),
        ]);
        setConnections(connectionsResponse.data ?? []);
        setNotifications(notificationsResponse.data ?? []);
      }
    } catch {
      setUser(null);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, []);

  const refreshConnections = async () => {
    if (!user) return;
    const [connectionsResponse, notificationsResponse] = await Promise.all([
      api.getConnections(),
      api.getNotifications().catch(() => ({ data: [] })),
    ]);
    setConnections(connectionsResponse.data ?? []);
    setNotifications(notificationsResponse.data ?? []);
  };

  const onAuthSuccess = async () => {
    await loadUser();
    navigate('/connections');
  };

  const handleAccept = async (connectionId: string) => {
    await api.updateConnection(connectionId, 'ACCEPTED');
    await refreshConnections();
  };

  const handleReject = async (connectionId: string) => {
    await api.updateConnection(connectionId, 'REJECTED');
    await refreshConnections();
  };

  const handleDelete = async (connectionId: string) => {
    await api.deleteConnection(connectionId);
    await refreshConnections();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setConnections([]);
    navigate('/');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading StayMate...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="shrink-0 text-xl font-bold tracking-tight text-indigo-600">StayMate</Link>
            <nav className="hidden items-center justify-end gap-1 text-sm lg:flex">
              <NavLink to="/" end className={({ isActive }) => navigationLinkClass(isActive)}>Home</NavLink>
            {user ? (
              <>
                <NavLink to="/connections" className={({ isActive }) => navigationLinkClass(isActive)}>Connections</NavLink>
                <NavLink to="/profile" className={({ isActive }) => navigationLinkClass(isActive)}>Profile</NavLink>
                <NavLink to="/preferences" className={({ isActive }) => navigationLinkClass(isActive)}>Preferences</NavLink>
                <NavLink to="/matches" className={({ isActive }) => navigationLinkClass(isActive)}>Matches</NavLink>
                <NavLink to="/groups" className={({ isActive }) => navigationLinkClass(isActive)}>Groups</NavLink>
                <NavLink to="/messages" className={({ isActive }) => navigationLinkClass(isActive)}>Messages</NavLink>
                <span className="ml-1 max-w-32 truncate rounded-full bg-indigo-50 px-3 py-1.5 font-medium text-slate-700 xl:max-w-44">{user.name}</span>
                <button onClick={handleLogout} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => navigationLinkClass(isActive)}>Login</NavLink>
                <NavLink to="/register" className={({ isActive }) => navigationLinkClass(isActive)}>Register</NavLink>
              </>
            )}
            </nav>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
          {mobileNavOpen && (
            <nav className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-100 pt-3 text-sm lg:hidden">
              <NavLink to="/" end onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Home</NavLink>
              {user ? (
                <>
                  <NavLink to="/connections" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Connections</NavLink>
                  <NavLink to="/profile" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Profile</NavLink>
                  <NavLink to="/preferences" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Preferences</NavLink>
                  <NavLink to="/matches" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Matches</NavLink>
                  <NavLink to="/groups" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Groups</NavLink>
                  <NavLink to="/messages" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Messages</NavLink>
                  <span className="truncate px-3 py-2 font-medium text-slate-500">{user.name}</span>
                  <button onClick={() => { setMobileNavOpen(false); void handleLogout(); }} className="rounded-full px-3 py-2 text-left font-medium text-slate-600 hover:bg-slate-100">Logout</button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Login</NavLink>
                  <NavLink to="/register" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => navigationLinkClass(isActive)}>Register</NavLink>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-7 lg:py-9">
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/login" element={user ? <HomeDashboard user={user} connections={connections} notifications={notifications} onRefresh={refreshConnections} /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
          <Route path="/register" element={user ? <HomeDashboard user={user} connections={connections} notifications={notifications} onRefresh={refreshConnections} /> : <AuthPage mode="register" onSuccess={onAuthSuccess} />} />
          <Route path="/connections" element={user ? <ConnectionsPage userId={user.id} connections={connections} onAccept={handleAccept} onReject={handleReject} onDelete={handleDelete} /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
          <Route path="/preferences" element={user ? <PreferencesPage /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
          <Route path="/matches" element={user ? <MatchingPage userId={user.id} onConnectionCreated={refreshConnections} /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
          <Route path="/groups" element={user ? <GroupsPage userId={user.id} /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
          <Route path="/messages" element={user ? <ChatPanel user={user} /> : <AuthPage mode="login" onSuccess={onAuthSuccess} />} />
        </Routes>
      </main>
    </div>
  );
}

function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-8 text-white shadow-lg">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Find your people before you move.</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight">Moving to a new city? Find compatible roommates and build your group.</h1>
        <p className="mt-4 max-w-xl text-lg text-indigo-50">
          StayMate helps people moving to the same destination connect based on budget, move-in date, lifestyle, and room preference.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to={user ? '/connections' : '/register'} className="rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 shadow-sm">{user ? 'View connections' : 'Get started'}</Link>
          <Link to="/login" className="rounded-xl border border-white/40 bg-white/5 px-5 py-3 font-semibold text-white">Login</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['01', 'Tell us where you are going'],
          ['02', 'Set your budget and preferences'],
          ['03', 'Find compatible people'],
          ['04', 'Connect and form a group'],
        ].map(([number, text]) => (
          <div key={number} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-bold text-indigo-600">{number}</div>
            <div className="mt-3 text-slate-700">{text}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

function AuthPage({ mode, onSuccess }: { mode: 'login' | 'register'; onSuccess: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-8">
      <AuthForm mode={mode} onSuccess={onSuccess} />
    </div>
  );
}

function HomeDashboard({ user, connections, notifications, onRefresh }: { user: User; connections: ConnectionItem[]; notifications: any[]; onRefresh: () => Promise<void> }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">Dashboard</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Welcome, {user.name}</h2>
          </div>
          <button onClick={() => { void onRefresh(); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total requests" value={connections.length.toString()} accent="indigo" />
        <StatCard label="Accepted" value={connections.filter((item) => item.status === 'ACCEPTED').length.toString()} accent="emerald" />
        <StatCard label="Pending" value={connections.filter((item) => item.status === 'PENDING').length.toString()} accent="amber" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Profile', href: '/profile', tone: 'indigo' },
          { label: 'Preferences', href: '/preferences', tone: 'violet' },
          { label: 'Matches', href: '/matches', tone: 'emerald' },
          { label: 'Groups', href: '/groups', tone: 'amber' },
        ].map((item) => (
          <Link key={item.label} to={item.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-sm font-semibold text-slate-500">Quick access</div>
            <div className="mt-3 text-xl font-bold text-slate-900">{item.label}</div>
            <div className="mt-3 text-xs uppercase tracking-[0.15em] text-indigo-600">Open</div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
          <Link to="/messages" className="text-sm font-medium text-indigo-600">Open messages</Link>
        </div>
        <div className="mt-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-sm text-slate-500">No notifications yet.</div>
          ) : (
            notifications.slice(0, 3).map((notification: any) => (
              <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-800">{notification.title}</div>
                <div className="text-xs text-slate-600">{notification.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionsPage({ userId, connections, onAccept, onReject, onDelete }: { userId: string; connections: ConnectionItem[]; onAccept: (id: string) => void; onReject: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-3xl font-bold text-slate-900">Connections</h2>
        <p className="mt-2 text-slate-600">Manage incoming requests, accepted matches, and your social network.</p>
      </div>
      <ConnectionBoard userId={userId} items={connections} onAccept={onAccept} onReject={onReject} onDelete={onDelete} />
    </div>
  );
}

function ProfilePage({ user }: { user: User }) {
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
          age: data.age ?? '',
          gender: data.gender ?? 'PREFER_NOT_TO_SAY',
          occupationType: data.occupationType ?? 'OTHER',
          college: data.college ?? '',
          company: data.company ?? '',
          bio: data.bio ?? '',
        });
      } catch {
        // leave defaults
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
        college: form.college,
        company: form.company,
        bio: form.bio,
      });
      alert('Profile updated.');
    } catch (error: any) {
      alert(error.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const onPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 8 MB.');
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
        throw new Error('This image could not be compressed enough. Try another photo.');
      }
      setForm((current) => ({ ...current, profilePhoto: compressedPhoto }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Could not read this image.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Your profile</h2>
      <p className="mt-2 text-slate-600">Tell others more about who you are and what you’re looking for.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="mb-6 flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:gap-4 sm:p-4">
          <AvatarPreview name={user.name} photo={form.profilePhoto} size="lg" />
          <div className="min-w-0 flex-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-photo">Profile photo</label>
            <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onPhotoSelected(event)} className="mt-1 block w-full min-w-0 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-indigo-700 file:ring-1 file:ring-slate-200 hover:file:bg-indigo-50" />
            <p className="mt-1 text-xs text-slate-500">Images are resized before saving.</p>
            {form.profilePhoto && <button type="button" onClick={() => setForm((current) => ({ ...current, profilePhoto: '' }))} className="mt-1 text-xs font-medium text-rose-700 hover:underline">Remove photo</button>}
            {photoError && <p role="alert" className="mt-1 text-xs text-rose-700">{photoError}</p>}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Age
            <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="18" max="80" />
          </label>
          <label className="text-sm text-slate-700">
            Gender
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Occupation
            <select value={form.occupationType} onChange={(e) => setForm({ ...form, occupationType: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="STUDENT">Student</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="INTERN">Intern</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            College
            <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Your college or university" />
          </label>
        </div>
        <label className="block text-sm text-slate-700">
          Company
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Current or last employer" />
        </label>
        <label className="block text-sm text-slate-700">
          Bio
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Write a short bio for your profile" />
        </label>
        <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}

function PreferencesPage() {
  const [form, setForm] = useState({
    city: '',
    area: '',
    budgetMin: 0,
    budgetMax: 0,
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
        const data = response.data ?? {};
        setForm({
          city: data.city ?? '',
          area: data.area ?? '',
          budgetMin: data.budgetMin ?? 0,
          budgetMax: data.budgetMax ?? 0,
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
      } catch {
        // leave defaults
      }
    })();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.savePreferences({
        ...form,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        roommatesRequired: Number(form.roommatesRequired),
        moveInDate: form.moveInDate ? new Date(form.moveInDate).toISOString() : new Date().toISOString(),
      });
      alert('Preferences saved.');
    } catch (error: any) {
      alert(error.message || 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-3xl font-bold text-slate-900">Living preferences</h2>
      <p className="mt-2 text-slate-600">Set your move location, room expectations, and roommate compatibility filters.</p>
      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm text-slate-700">Area<input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">Budget min<input type="number" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm text-slate-700">Budget max<input type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">Move-in date<input type="date" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm text-slate-700">Room type<select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="SINGLE">Single</option><option value="DOUBLE">Double</option><option value="TRIPLE">Triple</option><option value="FOUR_PLUS">Four plus</option><option value="ANY">Any</option></select></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">Roommates required<input type="number" min="1" max="4" value={form.roommatesRequired} onChange={(e) => setForm({ ...form, roommatesRequired: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm text-slate-700">Gender preference<select value={form.genderPreference} onChange={(e) => setForm({ ...form, genderPreference: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="ANY">Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">Smoking<select value={form.smokingPreference} onChange={(e) => setForm({ ...form, smokingPreference: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="NO_PREFERENCE">No preference</option><option value="NON_SMOKER">Non-smoker</option><option value="SMOKER">Smoker</option></select></label>
          <label className="text-sm text-slate-700">Drinking<select value={form.drinkingPreference} onChange={(e) => setForm({ ...form, drinkingPreference: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="NO_PREFERENCE">No preference</option><option value="NON_DRINKER">Non-drinker</option><option value="DRINKER">Drinker</option></select></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">Food preference<select value={form.foodPreference} onChange={(e) => setForm({ ...form, foodPreference: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="ANY">Any</option><option value="VEG">Veg</option><option value="NON_VEG">Non-veg</option><option value="VEGAN">Vegan</option></select></label>
          <label className="text-sm text-slate-700">Sleep schedule<select value={form.sleepSchedule} onChange={(e) => setForm({ ...form, sleepSchedule: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="FLEXIBLE">Flexible</option><option value="EARLY">Early</option><option value="LATE">Late</option></select></label>
        </div>
        <label className="block text-sm text-slate-700">Cleanliness<select value={form.cleanlinessPreference} onChange={(e) => setForm({ ...form, cleanlinessPreference: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
        <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save preferences'}</button>
      </form>
    </div>
  );
}

function MatchingPage({ userId, onConnectionCreated }: { userId: string; onConnectionCreated: () => Promise<void> }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsPreferences, setNeedsPreferences] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const preferenceResponse = await api.getPreferences();
        if (!preferenceResponse.data) {
          setNeedsPreferences(true);
          setMatches([]);
          setConnections([]);
          return;
        }

        setNeedsPreferences(false);
        const [response, connectionsResponse] = await Promise.all([
          api.getMatchingPeople(userId),
          api.getConnections().catch(() => ({ data: [] as ConnectionItem[] })),
        ]);
        setMatches(response.data ?? []);
        setConnections(connectionsResponse.data ?? []);
        setSelectedMatchId((response.data ?? [])[0]?.user?.id ?? null);
      } catch (error) {
        setMatches([]);
        setSelectedMatchId(null);
        setLoadError(error instanceof Error ? error.message : 'Could not load matches.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const selectedMatch = matches.find((match) => match.user.id === selectedMatchId) ?? matches[0] ?? null;
  const existingConnection = selectedMatch
    ? connections.find((connection) =>
      (connection.senderId === userId && connection.receiverId === selectedMatch.user.id)
      || (connection.senderId === selectedMatch.user.id && connection.receiverId === userId))
    : undefined;
  const isOutgoingRequest = existingConnection?.senderId === userId;

  const sendConnectionRequest = async () => {
    if (!selectedMatch || existingConnection || sendingRequest) return;

    setSendingRequest(true);
    setRequestMessage('');
    try {
      const response = await api.createConnection(selectedMatch.user.id);
      if (response.data) {
        setConnections((current) => [response.data as ConnectionItem, ...current]);
      }
      setRequestMessage(response.message ?? 'Connection request sent.');
      await onConnectionCreated();
    } catch (error) {
      setRequestMessage(error instanceof Error ? error.message : 'Could not send connection request.');
      try {
        const response = await api.getConnections();
        setConnections(response.data ?? []);
      } catch {
        // Keep the current connection state if refresh fails.
      }
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Match recommendations</h2>
        <p className="mt-2 text-slate-600">People most compatible with your move preferences and lifestyle.</p>
      </div>
      {loading ? <div className="rounded-xl bg-white p-4 text-slate-600 sm:p-6">Loading matches...</div> : needsPreferences ? (
        <section className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-lg font-semibold text-slate-900">Set your preferences to see matches</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Add your destination, budget, move-in date, and living preferences first. We’ll use them to find compatible roommates.</p>
          <Link to="/preferences" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">Enter preferences</Link>
        </section>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {matches.length === 0 ? (
              <div className="rounded-xl bg-white p-4 text-slate-600 ring-1 ring-slate-200 md:col-span-2">No compatible profiles found yet.</div>
            ) : matches.map((match) => {
              const isSelected = selectedMatch?.user?.id === match.user.id;
              return (
                <button
                  key={match.user.id}
                  type="button"
                  onClick={() => {
                    setSelectedMatchId(match.user.id);
                    setRequestMessage('');
                  }}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarPreview name={match.user.name} photo={match.profile?.profilePhoto} size="md" />
                      <div>
                        <div className="text-lg font-bold text-slate-900">{match.user.name}</div>
                        <div className="text-sm text-slate-500">{match.profile?.occupationType ?? 'Profile available'}</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-700">{match.compatibilityScore}%</span>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">{match.profile?.bio ?? 'Looking for a compatible roommate match.'}</div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{match.preference.city}</span>
                    <span>{match.preference.budgetMin}-{match.preference.budgetMax}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedMatch && (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50 to-violet-50 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <AvatarPreview name={selectedMatch.user.name} photo={selectedMatch.profile?.profilePhoto} size="lg" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{selectedMatch.user.name}</div>
                  <div className="text-sm text-slate-500">{selectedMatch.profile?.occupationType ?? 'Profile available'}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{selectedMatch.compatibilityScore}% match</span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">{selectedMatch.preference.city}</span>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">{selectedMatch.preference.roomType}</span>
              </div>

              <div className="mt-5 rounded-2xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
                {selectedMatch.profile?.bio ?? 'Looking for a compatible roommate match.'}
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-800">Move-in:</span> {selectedMatch.preference.moveInDate ? new Date(selectedMatch.preference.moveInDate).toLocaleDateString() : 'Flexible'}</div>
                <div><span className="font-semibold text-slate-800">Budget:</span> {selectedMatch.preference.budgetMin}-{selectedMatch.preference.budgetMax}</div>
                <div><span className="font-semibold text-slate-800">Lifestyle:</span> {selectedMatch.preference.smokingPreference}, {selectedMatch.preference.drinkingPreference}, {selectedMatch.preference.foodPreference}</div>
              </div>

              {existingConnection?.status === 'PENDING' && !isOutgoingRequest ? (
                <Link to="/connections" className="mt-6 block w-full rounded-xl bg-amber-100 px-4 py-2.5 text-center font-semibold text-amber-800 transition hover:bg-amber-200">
                  Review incoming request
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void sendConnectionRequest()}
                  disabled={sendingRequest || Boolean(existingConnection)}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {sendingRequest ? 'Sending request...' : existingConnection?.status === 'ACCEPTED' ? 'Connected' : existingConnection?.status === 'PENDING' ? 'Request pending' : existingConnection ? 'Request unavailable' : 'Send connection request'}
                </button>
              )}
              {requestMessage && <p role="status" className="mt-3 text-sm text-slate-600">{requestMessage}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupsPage({ userId }: { userId: string }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    city: '',
    area: '',
    budgetMin: 0,
    budgetMax: 0,
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
    return [group.name, group.city, group.area, group.description].some((value) => String(value ?? '').toLowerCase().includes(term));
  });

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.createGroup({
        ...form,
        moveInDate: new Date(form.moveInDate || Date.now()).toISOString(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        targetMembers: Number(form.targetMembers),
      });
      setForm({ name: '', city: '', area: '', budgetMin: 0, budgetMax: 0, moveInDate: '', targetMembers: 4, description: '' });
      await loadGroups();
      alert('Group created.');
    } catch (error: any) {
      alert(error.message || 'Could not create group.');
    }
  };

  const onJoin = async (groupId: string) => {
    try {
      await api.joinGroup(groupId);
      await loadGroups();
      alert('Join request sent.');
    } catch (error: any) {
      alert(error.message || 'Could not join group.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-3xl font-bold text-slate-900">Groups</h2>
        <p className="mt-2 text-slate-600">Create or join groups moving to the same destination.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-xl font-semibold text-slate-900">Create a group</h3>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Group name" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="City" />
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Area" />
          <input type="date" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
          <input type="number" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Budget min" />
          <input type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Budget max" />
          <input type="number" min="2" max="10" value={form.targetMembers} onChange={(e) => setForm({ ...form, targetMembers: Number(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" placeholder="Target members" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" placeholder="Description" />
          <div className="md:col-span-2"><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">Create group</button></div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Available groups</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by city, area or name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:max-w-xs"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-slate-500 md:col-span-2">No matching groups yet.</div>
          ) : filteredGroups.map((group) => (
            <div key={group.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
                <div>
                  <div className="text-lg font-bold">{group.name}</div>
                  <div className="text-xs uppercase tracking-[0.15em] text-indigo-100">Roommate marketplace</div>
                </div>
                <div className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">{group.members.length}/{group.targetMembers}</div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{group.city}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{group.area}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">₹{group.budgetMin}-{group.budgetMax}</span>
                </div>
                <div className="mt-4 text-sm text-slate-600">{group.description || 'Looking for compatible roommates.'}</div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span>Move-in: {group.moveInDate ? new Date(group.moveInDate).toLocaleDateString() : 'Flexible'}</span>
                  <span>{group.members.length} joined</span>
                </div>
                <button onClick={() => onJoin(group.id)} className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">Join group</button>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white shadow-sm`}
        onError={(event) => {
          const target = event.currentTarget as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white shadow-sm`}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'indigo' | 'emerald' | 'amber' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[accent]}`}>{label}</div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
