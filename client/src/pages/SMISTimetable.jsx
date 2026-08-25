import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function SMISTimetable({ role = 'pupil' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    try { setError(''); const r = await fetch(`${API}/smis/timetable`, { credentials: 'include' }); if (!r.ok) throw new Error('Unable to load timetable'); const p = await r.json(); setRows(p?.data || []); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); const t = setInterval(load, 30000); window.addEventListener('focus', load); return () => { clearInterval(t); window.removeEventListener('focus', load); }; }, []);
  return <main className="space-y-6 p-6"><header><h1 className="text-2xl font-bold">{role === 'admin' ? 'Timetable Management' : 'My Timetable'}</h1><p className="text-sm text-slate-500">Live timetable records from the school database.</p></header>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{loading ? <div className="rounded-xl border bg-white p-6">Loading timetable…</div> : rows.length ? <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Time</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Room</th></tr></thead><tbody>{rows.map(x => <tr key={x._id} className="border-b last:border-0"><td className="p-3">{['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][x.dayOfWeek] || '—'}</td><td className="p-3">{x.period}</td><td className="p-3">{x.startTime}–{x.endTime}</td><td className="p-3">{x.schoolClass?.name || '—'}{x.stream ? ` / ${x.stream}` : ''}</td><td className="p-3">{x.subject?.name || '—'}</td><td className="p-3">{x.teacher?.name || [x.teacher?.firstName, x.teacher?.lastName].filter(Boolean).join(' ') || '—'}</td><td className="p-3">{x.room || '—'}</td></tr>)}</tbody></table></div> : <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">No timetable has been configured for this school yet.</div>}</main>;
}
