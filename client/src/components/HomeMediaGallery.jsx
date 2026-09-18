import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

const fallbackItems = [
  { _id: "sample-image-1", title: "School life", category: "Campus", mediaType: "image", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=85", caption: "A glimpse of learning and community life." },
  { _id: "sample-image-2", title: "Learning spaces", category: "Campus", mediaType: "image", url: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1400&q=85", caption: "Spaces where learners grow and discover." },
  { _id: "sample-video-1", title: "Sample school video", category: "Video", mediaType: "video", url: "https://mdn.github.io/shared-assets/videos/flower.mp4", caption: "Sample MP4 used to verify homepage video playback." },
];

export default function HomeMediaGallery() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest("/cms/gallery")
      .then((data) => { if (active) setItems(Array.isArray(data) && data.length ? data : fallbackItems); })
      .catch(() => { if (active) setItems(fallbackItems); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.mediaType === filter), [filter, items]);

  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">School gallery</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-blue-950 md:text-4xl">Life at Angels Home</h2>
            <p className="mt-4 text-lg leading-7 text-slate-600">Photos and videos published by the school administration appear here automatically.</p>
          </div>
          <div className="flex gap-2">
            {[["all", "All"], ["image", "Photos"], ["video", "Videos"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={filter === value ? "rounded-full bg-blue-950 px-4 py-2 text-sm font-black text-white" : "rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200"}>{label}</button>
            ))}
          </div>
        </div>

        {visible.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <article key={item._id || item.url} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <button type="button" onClick={() => setSelected(item)} className="block w-full text-left">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {item.mediaType === "video" ? (
                      <video className="h-full w-full object-cover" muted playsInline preload="metadata" src={item.url} />
                    ) : (
                      <img src={item.url || item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    {item.mediaType === "video" && <span className="absolute bottom-3 left-3 rounded-full bg-blue-950/90 px-3 py-1 text-xs font-black text-white">▶ Video</span>}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-600">{item.category || "General"}</p>
                    <h3 className="mt-2 text-xl font-black text-blue-950">{item.title}</h3>
                    {item.caption && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.caption}</p>}
                  </div>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No media is published in this category yet.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/90 p-4" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><p className="text-xs font-black uppercase tracking-widest text-amber-600">{selected.category || "General"}</p><h3 className="text-xl font-black text-blue-950">{selected.title}</h3></div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full bg-slate-100 px-4 py-2 font-black text-slate-700">Close</button>
            </div>
            {selected.mediaType === "video" ? (
              <video className="max-h-[75vh] w-full bg-black" controls autoPlay playsInline src={selected.url} />
            ) : (
              <img src={selected.url || selected.image} alt={selected.title} className="max-h-[75vh] w-full object-contain bg-slate-100" />
            )}
            {selected.caption && <p className="px-5 py-4 text-sm leading-6 text-slate-600">{selected.caption}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
