import { Link } from "react-router-dom";
import HeroSlider from "../components/HeroSlider";
import ProgressBar from "../components/ProgressBar";
import LatestNews from "../components/LatestNews";

const stats = [
  ["248+", "Learners served"],
  ["24", "Dedicated teachers"],
  ["94%", "Average attendance"],
  ["10+", "Years of impact"],
];

const pillars = [
  ["01", "Academic excellence", "Strong foundations, purposeful teaching and measurable learner progress."],
  ["02", "Character & faith", "Discipline, integrity, compassion and leadership are woven into school life."],
  ["03", "Whole-child care", "Pastoral support, creativity, sport and mentorship help every learner flourish."],
];

const pathways = [
  ["For families", "Parents & pupils", "Access learning support, school information and secure portal services.", "/register?role=parent", "Explore family services"],
  ["For educators", "Teachers", "Connect with colleagues, manage learning and communicate with families.", "/register?role=teacher", "Join our teaching community"],
  ["For impact partners", "Sponsors & partners", "Help fund meaningful education programmes and follow the impact of your contribution.", "/register?role=sponsor", "Partner with Angels Home"],
];

export default function Home() {
  return (
    <main className="bg-white text-slate-900">
      <HeroSlider />

      <section className="relative -mt-8 z-10 mx-auto max-w-7xl px-5">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="border-b border-slate-100 px-6 py-6 text-center last:border-b-0 sm:border-r lg:border-b-0 lg:last:border-r-0">
              <p className="text-3xl font-black tracking-tight text-blue-950">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">Education with purpose</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-blue-950 sm:text-5xl md:text-6xl">Growing confident learners. Building stronger futures.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">At Angels Home Education Centre, quality education, character development and compassionate care come together to help every learner discover their potential and prepare for a meaningful future.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register?role=parent" className="rounded-xl bg-blue-950 px-6 py-3.5 font-black text-white shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5 hover:bg-blue-900">Enquire about admissions</Link>
              <Link to="/academics" className="rounded-xl border border-slate-300 px-6 py-3.5 font-black text-slate-700 transition hover:border-blue-300 hover:bg-slate-50">Explore academics</Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 shadow-sm md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Our promise</p>
            <div className="mt-7 space-y-7">
              {pillars.map(([number, title, text]) => (
                <div key={number} className="flex gap-4">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">{number}</span>
                  <div>
                    <h2 className="text-lg font-black text-blue-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">A community built around learners</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-blue-950 md:text-4xl">One school. One community. One future.</h2>
            <p className="mt-4 text-lg leading-7 text-slate-600">Whether you are a parent, teacher, sponsor or community partner, there is a meaningful way to participate in the Angels Home journey.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pathways.map(([eyebrow, title, text, href, action]) => (
              <Link key={title} to={href} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                <p className="text-xs font-black uppercase tracking-widest text-amber-600">{eyebrow}</p>
                <h3 className="mt-3 text-2xl font-black text-blue-950">{title}</h3>
                <p className="mt-3 flex-1 leading-7 text-slate-600">{text}</p>
                <span className="mt-7 text-sm font-black text-blue-700 group-hover:text-amber-600">{action} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LatestNews />

      <section className="mx-auto max-w-7xl px-5 py-20 md:py-24">
        <div className="overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-xl">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="p-8 sm:p-12">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Make an impact</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Help us create more opportunities for learners.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-blue-100">Your support helps strengthen learning programmes, improve facilities and make quality education accessible to more children.</p>
              <Link to="/support" className="mt-8 inline-flex rounded-xl bg-amber-400 px-6 py-3.5 font-black text-blue-950 transition hover:-translate-y-0.5 hover:bg-amber-300">Support our mission</Link>
            </div>
            <div className="relative min-h-[280px] overflow-hidden">
              <img src="/images/secondary.jpg" alt="Angels Home school community" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/35 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Ready to take the next step?</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Discover what Angels Home can mean for your child.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/contact" className="rounded-xl border border-slate-300 px-6 py-3 font-black text-slate-700 hover:bg-slate-50">Contact us</Link>
            <Link to="/register?role=parent" className="rounded-xl bg-blue-950 px-6 py-3 font-black text-white hover:bg-blue-900">Get started</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:pb-24">
        <ProgressBar />
      </section>
    </main>
  );
}
