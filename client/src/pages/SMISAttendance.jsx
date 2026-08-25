import React, { useMemo, useState } from 'react';

const statuses = ['present', 'absent', 'sick', 'late'];

const demoPupils = [
  { id: 'p1', admissionNumber: 'AH001', name: 'Pupil One', stream: 'A' },
  { id: 'p2', admissionNumber: 'AH002', name: 'Pupil Two', stream: 'A' },
  { id: 'p3', admissionNumber: 'AH003', name: 'Pupil Three', stream: 'B' },
  { id: 'p4', admissionNumber: 'AH004', name: 'Pupil Four', stream: 'B' },
];

const label = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function SMISAttendance() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [className, setClassName] = useState('');
  const [stream, setStream] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState({});
  const [saved, setSaved] = useState(false);

  const pupils = useMemo(() => demoPupils.filter((pupil) =>
    (!stream || pupil.stream === stream) &&
    (!search || `${pupil.name} ${pupil.admissionNumber}`.toLowerCase().includes(search.toLowerCase()))
  ), [search, stream]);

  const setStatus = (id, status) => {
    setSaved(false);
    setRecords((current) => ({ ...current, [id]: status }));
  };

  const markAll = (status) => {
    setSaved(false);
    setRecords((current) => Object.fromEntries(pupils.map((pupil) => [pupil.id, status])));
  };

  const summary = statuses.reduce((acc, status) => ({ ...acc, [status]: pupils.filter((p) => records[p.id] === status).length }), {});

  const save = () => {
    setSaved(true);
    // The SMIS attendance API can be wired here once class enrolment records are available.
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Management</h1>
        <p className="text-sm text-slate-500">Daily pupil attendance register for the school.</p>
      </div>

      <section className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-4">
        <label className="text-sm font-medium">Date<input className="mt-1 w-full rounded-lg border p-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="text-sm font-medium">Class<select className="mt-1 w-full rounded-lg border p-2" value={className} onChange={(e) => setClassName(e.target.value)}><option value="">Select class</option><option>Grade 1</option><option>Grade 2</option><option>Grade 3</option><option>Grade 4</option><option>Grade 5</option><option>Grade 6</option><option>Grade 7</option><option>Grade 8</option></select></label>
        <label className="text-sm font-medium">Stream<select className="mt-1 w-full rounded-lg border p-2" value={stream} onChange={(e) => setStream(e.target.value)}><option value="">All streams</option><option value="A">A</option><option value="B">B</option></select></label>
        <label className="text-sm font-medium">Search pupils<input className="mt-1 w-full rounded-lg border p-2" placeholder="Name or admission no." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {statuses.map((status) => <div key={status} className="rounded-xl border bg-white p-4"><div className="text-xs uppercase text-slate-500">{label(status)}</div><div className="mt-1 text-2xl font-bold">{summary[status]}</div></div>)}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => markAll('present')}>Mark all present</button>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => markAll('absent')}>Mark all absent</button>
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={save}>Save attendance</button>
          {saved && <span className="self-center text-sm font-medium text-green-600">Attendance saved for {date}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-slate-500"><th className="p-3">Admission</th><th className="p-3">Pupil</th><th className="p-3">Stream</th><th className="p-3">Status</th></tr></thead>
            <tbody>{pupils.map((pupil) => <tr key={pupil.id} className="border-b last:border-0"><td className="p-3 font-medium">{pupil.admissionNumber}</td><td className="p-3">{pupil.name}</td><td className="p-3">{pupil.stream}</td><td className="p-3"><div className="flex flex-wrap gap-1">{statuses.map((status) => <button key={status} onClick={() => setStatus(pupil.id, status)} className={`rounded-md border px-2 py-1 text-xs ${records[pupil.id] === status ? 'bg-slate-900 text-white' : ''}`}>{label(status)}</button>)}</div></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
