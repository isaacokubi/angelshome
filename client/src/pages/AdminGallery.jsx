import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const initialForm = { title: "", category: "Campus", mediaType: "image", url: "", caption: "", isPublished: true, sortOrder: 0 };

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    try { setItems(await apiRequest("/admin/gallery")); }
    catch (error) { setMessage(error.message); }
  };

  useEffect(() => { load(); }, []);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setMessage("For direct testing, keep uploads under 8 MB. Larger media should be hosted and added by URL.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, url: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage("");
    try {
      await apiRequest("/admin/gallery", { method: "POST", body: JSON.stringify(form) });
      setForm(initialForm); setFileName(""); setMessage("Media published successfully."); await load();
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this media item?")) return;
    try { await apiRequest("/admin/gallery/" + id, { method: "DELETE" }); await load(); }
    catch (error) { setMessage(error.message); }
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-900 p-7 text-white shadow-lg"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Homepage media</p><h1 className="mt-2 text-3xl font-black">Photos & Videos</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Upload a test image/video directly or paste a hosted media URL. Published items appear automatically on the public homepage.</p></div>
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="School open day" /></label>
        <label className="text-sm font-bold text-slate-700">Media type<select value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value, url: "" })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"><option value="image">Image</option><option value="video">Video</option></select></label>
        <label className="text-sm font-bold text-slate-700">Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        <label className="text-sm font-bold text-slate-700">Upload file<input type="file" accept={form.mediaType === "image" ? "image/*" : "video/*"} onChange={handleFile} className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-2.5" /></label>
        <label className="text-sm font-bold text-slate-700 md:col-span-2">Hosted media URL<input value={form.url.startsWith("data:") ? "" : form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="https://example.com/photo.jpg or video.mp4" /></label>
        {fileName && <p className="text-xs font-semibold text-emerald-700 md:col-span-2">Selected file: {fileName}</p>}
        <label className="text-sm font-bold text-slate-700 md:col-span-2">Caption<textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Short description shown with the media." /></label>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish on homepage</label>
      </div>
      {message && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{message}</p>}
      <button disabled={saving} className="mt-5 rounded-xl bg-blue-950 px-6 py-3 font-black text-white disabled:opacity-50">{saving ? "Publishing…" : "Publish media"}</button>
    </form>
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="aspect-video bg-slate-100">{item.mediaType === "video" ? <video controls className="h-full w-full object-cover" src={item.url} /> : <img src={item.url || item.image} alt={item.title} className="h-full w-full object-cover" />}</div>
        <div className="p-4"><p className="text-xs font-black uppercase tracking-widest text-amber-600">{item.category}</p><h2 className="mt-1 font-black text-blue-950">{item.title}</h2><p className="mt-1 text-xs text-slate-500">{item.isPublished ? "Published" : "Hidden"}</p><button type="button" onClick={() => remove(item._id)} className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button></div>
      </article>)}
    </div>
  </div>;
}
