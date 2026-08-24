import { useState } from "react";

export default function StaffCard({ image, name, position, description }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-72 overflow-hidden bg-slate-100">
        {image && !imageFailed ? (
          <div className="flex h-full w-full items-center justify-center p-3 sm:p-4">
            <img src={image} alt={`${name} — ${position}`} className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-[1.02]" loading="lazy" onError={() => setImageFailed(true)} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 text-5xl font-black text-white/90" aria-label={`${name} profile placeholder`}>{initials}</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent p-5 pt-16"><span className="inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-950">{position}</span></div>
      </div>
      <div className="p-6"><h3 className="text-xl font-black text-blue-950">{name}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></div>
    </article>
  );
}
