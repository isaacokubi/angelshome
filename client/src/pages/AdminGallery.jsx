import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const initialForm = { title: "", category: "Campus", mediaType: "image", url: "", caption: "", isPublished: true, sortOrder: 0, consentConfirmed: false, consentNote: "" };

function uploadToCloudinary(file, config, onProgress) {
  return new Promise((resolve, reject) => {
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", String(config.timestamp));
    formData.append("signature", config.signature);
    formData.append("folder", config.folder);

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("The media upload failed. Check your internet connection and try again."));
    xhr.onabort = () => reject(new Error("The media upload was cancelled."));
    xhr.onload = () => {
      let payload = {};
      try { payload = JSON.parse(xhr.responseText || "{}"); } catch { /* ignore malformed cloud response */ }
      if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) return resolve(payload);
      reject(new Error(payload.error?.message || `Cloud media upload failed (HTTP ${xhr.status}).`));
    };
    xhr.send(formData);
  });
}

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const load = async () => {
    try { setItems(await apiRequest("/admin/gallery")); }
    catch (error) { setMessage(error.message); }
  };

  useEffect(() => { load(); }, []);

  const handleMediaTypeChange = (mediaType) => {
    setForm((current) => ({ ...current, mediaType, url: "" }));
    setSelectedFile(null);
    setFileName("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isVideo = form.mediaType === "video";
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      setSelectedFile(null);
      setFileName("");
      event.target.value = "";
      setMessage(`${isVideo ? "Videos" : "Images"} must be ${isVideo ? "100 MB" : "10 MB"} or smaller. Selected file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }
    if (isVideo && !file.type.startsWith("video/")) {
      setMessage("Please select a valid video file.");
      return;
    }
    if (!isVideo && !file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }
    setSelectedFile(file);
    setFileName(file.name);
    setForm((current) => ({ ...current, url: "" }));
    setUploadProgress(0);
    setMessage(`${file.name} selected (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setUploadProgress(0);
    try {
      let mediaUrl = form.url.trim();

      if (selectedFile) {
        setMessage("Preparing secure cloud upload…");
        const config = await apiRequest("/admin/gallery/upload-signature", {
          method: "POST",
          body: JSON.stringify({ mediaType: form.mediaType }),
        });
        setMessage(`Uploading ${selectedFile.name}…`);
        const uploaded = await uploadToCloudinary(selectedFile, config, setUploadProgress);
        mediaUrl = uploaded.secure_url;
      }

      if (!mediaUrl) throw new Error("Select a media file or provide a hosted media URL.");
      if (form.mediaType === "image" && !form.consentConfirmed) throw new Error("Confirm that you have permission to publish this school media.");
      await apiRequest("/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ ...form, url: mediaUrl, image: form.mediaType === "image" ? mediaUrl : "" }),
      });

      setForm(initialForm);
      setSelectedFile(null);
      setFileName("");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Media published successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this media item?")) return;
    try { await apiRequest("/admin/gallery/" + id, { method: "DELETE" }); await load(); }
    catch (error) { setMessage(error.message); }
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-900 p-7 text-white shadow-lg">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Homepage media</p>
      <h1 className="mt-2 text-3xl font-black">Photos & Videos</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Upload images directly to secure cloud storage or upload videos up to 100 MB without sending the video through the school API. Published items appear automatically on the public homepage.</p>
    </div>

    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">Title
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="School open day" />
        </label>
        <label className="text-sm font-bold text-slate-700">Media type
          <select value={form.mediaType} onChange={(e) => handleMediaTypeChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3">
            <option value="image">Image</option><option value="video">Video</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700">Category
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="text-sm font-bold text-slate-700">Upload file
          <input ref={fileInputRef} type="file" accept={form.mediaType === "image" ? "image/*" : "video/*"} onChange={handleFile} className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-2.5" />
          <span className="mt-1 block text-xs font-semibold text-slate-500">{form.mediaType === "video" ? "Maximum video size: 100 MB" : "Maximum image size: 10 MB"}</span>
        </label>
        <label className="text-sm font-bold text-slate-700 md:col-span-2">Hosted media URL
          <input value={selectedFile ? "" : form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="https://example.com/photo.jpg or video.mp4" />
        </label>
        {fileName && <p className="text-xs font-semibold text-emerald-700 md:col-span-2">Selected file: {fileName}{uploadProgress > 0 ? ` — ${uploadProgress}% uploaded` : ""}</p>}
        <label className="text-sm font-bold text-slate-700 md:col-span-2">Caption
          <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Short description shown with the media." />
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish on homepage</label>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700 md:col-span-2"><input type="checkbox" checked={form.consentConfirmed} onChange={(e) => setForm({ ...form, consentConfirmed: e.target.checked })} /> I confirm the school has permission/appropriate consent to publish this media.</label>
        <label className="text-sm font-bold text-slate-700 md:col-span-2">Consent / source note (optional)<textarea value={form.consentNote} onChange={(e) => setForm({ ...form, consentNote: e.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="For example: parent/guardian consent recorded by the school on 18/09/2026." /></label>
      </div>
      {message && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{message}</p>}
      <button disabled={saving} className="mt-5 rounded-xl bg-blue-950 px-6 py-3 font-black text-white disabled:opacity-50">{saving ? (uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${uploadProgress}%…` : "Publishing…") : "Publish media"}</button>
    </form>

    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="aspect-video bg-slate-100">{item.mediaType === "video" ? <video controls className="h-full w-full object-cover" src={item.url} /> : <img src={item.url || item.image} alt={item.title} className="h-full w-full object-cover" />}</div>
        <div className="p-4"><p className="text-xs font-black uppercase tracking-widest text-amber-600">{item.category}</p><h2 className="mt-1 font-black text-blue-950">{item.title}</h2><p className="mt-1 text-xs text-slate-500">{item.isPublished ? "Published" : "Hidden"}</p><button type="button" onClick={() => remove(item._id)} className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button></div>
      </article>)}
    </div>
  </div>;
}
