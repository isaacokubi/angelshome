import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}${/\/api$/i.test(import.meta.env.VITE_API_URL || "http://localhost:5000/api") ? "" : "/api"}`;

const defaults = {
  school: { name: "Angels Home Education Centre", shortName: "Angels Home", motto: "Growing confident learners. Building stronger futures.", description: "Empowering young minds through quality education.", logo: "/favicon.svg" },
  contact: { phone: "+254 725 481 011", email: "angelshomecentre@gmail.com", whatsapp: "", address: "Angels Home Education Centre", postalAddress: "P.O Box 225-00510 · Nairobi, Kenya", officeHours: "Monday–Friday · 8:00 AM–5:00 PM", mapEmbed: "https://www.google.com/maps?q=-1.2635235,36.8578211&hl=en&z=17&output=embed" },
  social: { facebook: "", youtube: "", twitter: "", instagram: "" },
  homepage: { eyebrow: "Admissions · Partnerships · School Support", heroTitle: "Growing confident learners. Building stronger futures.", heroText: "Quality education, character development and compassionate care in a community where every child is encouraged to discover their potential.", heroImage: "/images/slide1.jpg", stats: [{ value: "248+", label: "Learners served" }, { value: "24", label: "Dedicated teachers" }, { value: "94%", label: "Average attendance" }, { value: "10+", label: "Years of impact" }], educationEyebrow: "Education with purpose", educationTitle: "Education that shapes character, purpose and opportunity.", educationText: "At Angels Home Education Centre, quality education, character development and compassionate care come together to help every learner discover their potential and prepare for a meaningful future.", pillars: [{ number: "01", title: "Academic excellence", text: "Strong foundations, purposeful teaching and measurable learner progress." }, { number: "02", title: "Character & faith", text: "Discipline, integrity, compassion and leadership are woven into school life." }, { number: "03", title: "Whole-child care", text: "Pastoral support, creativity, sport and mentorship help every learner flourish." }], communityEyebrow: "A community built around learners", communityTitle: "One school. One community. One future.", communityText: "Whether you are a parent, teacher, sponsor or community partner, there is a meaningful way to participate in the Angels Home journey.", pathways: [{ eyebrow: "For families", title: "Parents & pupils", text: "Access learning support, school information and secure portal services.", href: "/register?role=parent", action: "Explore family services" }, { eyebrow: "For educators", title: "Teachers", text: "Connect with colleagues, manage learning and communicate with families.", href: "/register?role=teacher", action: "Join our teaching community" }, { eyebrow: "For impact partners", title: "Sponsors & partners", text: "Help fund meaningful education programmes and follow the impact of your contribution.", href: "/register?role=sponsor", action: "Partner with Angels Home" }], developmentEyebrow: "School development fund", developmentTitle: "Help us create more opportunities for learners.", developmentText: "Your support helps strengthen learning programmes, improve facilities and make quality education accessible to more children.", developmentGoal: "KES 18.5M", finalEyebrow: "Ready to take the next step?", finalTitle: "Discover what Angels Home can mean for your child." },
  about: { title: "About Angels Home Education Centre", intro: "We are committed to providing affordable, quality and holistic education that empowers every learner to become a responsible, creative and productive member of society.", storyTitle: "Education, care and opportunity under one roof.", story: "Founded with the belief that every child deserves access to quality education, Angels Home Education Centre continues to nurture learners academically, socially and spiritually. Our school and home community brings together learning, character formation, pastoral care and practical support.", mission: "To provide Christ-centered, quality education and holistic care to orphans and vulnerable children.", vision: "To raise God-fearing leaders from the slums who will transform Kenya.", values: ["Integrity", "Excellence", "Discipline", "Innovation", "Respect"] },
  academics: { title: "A strong academic foundation for a changing world.", intro: "Balanced learning, practical skills, creativity and character development designed around the needs of every learner.", curriculumTitle: "Learning with breadth, depth and purpose.", curriculumText: "Our programme combines core academic subjects with creativity, physical development, technology and values-based education.", programmes: [{ title: "Lower Primary", subjects: ["English", "Mathematics", "Environmental Activities", "Creative Arts", "Religious Education"] }, { title: "Upper Primary", subjects: ["English", "Kiswahili", "Science", "Social Studies", "Agriculture", "Mathematics", "CRE", "Art & Craft", "PHE"] }, { title: "Junior Secondary", subjects: ["English", "Kiswahili", "Science", "Social Studies", "Agriculture", "Mathematics", "CRE", "Pre-technical", "PHE", "Computer Studies"] }, { title: "Enrichment", subjects: ["Football", "Music", "Debate", "Swimming", "Leadership", "Digital skills"] }], feeNote: "Contact admissions for the complete fee schedule and payment guidance." },
  support: { title: "Help create better opportunities for every learner.", intro: "Your support strengthens learning environments, learner welfare and programmes that help children build a hopeful future.", priorityTitle: "Where support can make a difference.", priorities: [{ title: "Infrastructure", description: "Classrooms, the home, laboratories and learning facilities.", amount: "KES 18,500,000", icon: "🏫" }, { title: "Scholarship Fund", description: "Supporting talented learners from disadvantaged families.", amount: "KES 2,000,000", icon: "🎓" }, { title: "Sports & Talent", description: "Equipment and programmes that develop confidence, teamwork and talent.", amount: "KES 1,000,000", icon: "⚽" }], donationText: "Complete the donation form below. Payment options and confirmation are handled through the Centre's configured payment services." },
  footer: { description: "Empowering young minds through quality education." },
};

const merge = (base, value) => {
  if (Array.isArray(base)) return Array.isArray(value) ? value : base;
  if (base && typeof base === "object") return Object.fromEntries(Object.keys(base).map((key) => [key, merge(base[key], value?.[key])]));
  return value ?? base;
};

const SchoolSettingsContext = createContext({ settings: defaults, loading: false, refresh: async () => {} });

export function SchoolSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const response = await fetch(`${API_URL}/cms/settings`);
      if (!response.ok) throw new Error("Unable to load school settings");
      const payload = await response.json();
      setSettings(merge(defaults, payload?.data));
    } catch (error) {
      console.warn("School settings fallback:", error.message);
      setSettings(defaults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  const value = useMemo(() => ({ settings, loading, refresh }), [settings, loading]);
  return <SchoolSettingsContext.Provider value={value}>{children}</SchoolSettingsContext.Provider>;
}

export function useSchoolSettings() { return useContext(SchoolSettingsContext); }
export { defaults };
