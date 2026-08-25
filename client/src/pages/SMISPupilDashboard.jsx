import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function SMISPupilDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const response = await fetch(`${API}/portal/dashboard`, { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to load school dashboard');
      const payload = await response.json();
      setData(payload?.data || payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    window.addEventListener('focus', load);
    return () => { clearInterval(interval); window.removeEventListener('focus', load); };
  }, []);

  const school = data?.school || data || {};
  const cards = [
    ['Attendance', school.attendanceRate != null ? `${school.attendanceRate}%` : 'No records'],
    ['Subjects', school.subjectCount ?? 0],
    ['Assignments', school.assignmentCount ?? 0],
    ['Average', school.averageScore != null ? `${school.averageScore}%` : 'No assessments'],
  ];

  return <main className="space-y-6 p-6">
    <header><h1 className="text-2xl font-bold">My School Dashboard</h1><p className="text-sm text-slate-500">Live information from the school database.</p></header>
    {loading ? <div className="rounded-xl border bg-white p-6">Loading your school records…</div> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([title, value]) => <div key={title} className="rounded-xl border bg-white p-5"><div className="text-sm text-slate-500">{title}</div><div className="mt-2 text-2xl font-bold">{value}</div></div>)}</section>
      <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Recent school activity</h2><p className="mt-2 text-sm text-slate-500">{school.recentActivity?.length ? `${school.recentActivity.length} recent activities available.` : 'No school activity has been published for your account.'}</p></section>
    </>}
  </main>;
}
