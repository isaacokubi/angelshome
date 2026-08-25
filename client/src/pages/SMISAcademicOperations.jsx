import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function SMISAcademicOperations() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${API}/smis/classes`, { credentials: 'include' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('Unable to load classes'))),
      fetch(`${API}/smis/subjects`, { credentials: 'include' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('Unable to load subjects'))),
    ]).then(([classData, subjectData]) => {
      if (!active) return;
      setClasses(classData?.data || classData?.classes || []);
      setSubjects(subjectData?.data || subjectData?.subjects || []);
    }).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <main className="space-y-6 p-6">
      <header><h1 className="text-2xl font-bold">Academic Operations</h1><p className="text-sm text-slate-500">Live classes, streams and subjects from the school database.</p></header>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">Loading academic records…</div> : <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Classes & Streams</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{classes.length}</span></div>{classes.length ? <div className="space-y-2">{classes.map((item) => <div key={item._id || item.id} className="rounded-lg border p-3"><div className="font-medium">{item.name || item.className || 'Unnamed class'}</div><div className="text-xs text-slate-500">{item.stream || item.streamName || 'No stream'} · Capacity {item.capacity ?? '—'}</div></div>)}</div> : <p className="text-sm text-slate-500">No classes have been configured yet.</p>}</section>
        <section className="rounded-xl border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Subjects</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{subjects.length}</span></div>{subjects.length ? <div className="space-y-2">{subjects.map((item) => <div key={item._id || item.id} className="rounded-lg border p-3"><div className="font-medium">{item.name || item.subjectName || 'Unnamed subject'}</div><div className="text-xs text-slate-500">Code: {item.code || '—'} · Teacher: {item.teacherName || item.teacher?.name || 'Not assigned'}</div></div>)}</div> : <p className="text-sm text-slate-500">No subjects have been configured yet.</p>}</section>
      </div>}
    </main>
  );
}
