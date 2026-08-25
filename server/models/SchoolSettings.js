const mongoose = require("mongoose");

const statSchema = new mongoose.Schema({ value: { type: String, default: "" }, label: { type: String, default: "" } }, { _id: false });
const pillarSchema = new mongoose.Schema({ number: { type: String, default: "" }, title: { type: String, default: "" }, text: { type: String, default: "" } }, { _id: false });
const programmeSchema = new mongoose.Schema({ title: { type: String, default: "" }, subjects: { type: [String], default: [] } }, { _id: false });
const prioritySchema = new mongoose.Schema({ title: { type: String, default: "" }, description: { type: String, default: "" }, amount: { type: String, default: "" }, icon: { type: String, default: "" } }, { _id: false });
const pathwaySchema = new mongoose.Schema({ eyebrow: { type: String, default: "" }, title: { type: String, default: "" }, text: { type: String, default: "" }, href: { type: String, default: "" }, action: { type: String, default: "" } }, { _id: false });

const schema = new mongoose.Schema({
  key: { type: String, unique: true, default: "primary" },
  school: {
    name: { type: String, default: "Angels Home Education Centre" },
    shortName: { type: String, default: "Angels Home" },
    motto: { type: String, default: "Growing confident learners. Building stronger futures." },
    description: { type: String, default: "Empowering young minds through quality education." },
    logo: { type: String, default: "/favicon.svg" },
  },
  theme: {
    primaryColor: { type: String, default: "#0f172a" },
    secondaryColor: { type: String, default: "#f59e0b" },
    accentColor: { type: String, default: "#2563eb" },
    successColor: { type: String, default: "#16a34a" },
    logoHeight: { type: String, default: "40" },
    borderRadius: { type: String, default: "12" },
    footerStyle: { type: String, enum: ["standard", "compact", "centered"], default: "standard" },
  },
  contact: {
    phone: { type: String, default: "+254 725 481 011" },
    email: { type: String, default: "angelshomecentre@gmail.com" },
    whatsapp: { type: String, default: "" },
    address: { type: String, default: "Angels Home Education Centre" },
    postalAddress: { type: String, default: "P.O Box 225-00510 · Nairobi, Kenya" },
    officeHours: { type: String, default: "Monday–Friday · 8:00 AM–5:00 PM" },
    mapEmbed: { type: String, default: "https://www.google.com/maps?q=-1.2635235,36.8578211&hl=en&z=17&output=embed" },
  },
  social: {
    facebook: { type: String, default: "" }, youtube: { type: String, default: "" }, twitter: { type: String, default: "" }, instagram: { type: String, default: "" },
  },
  homepage: {
    eyebrow: { type: String, default: "Admissions · Partnerships · School Support" }, heroTitle: { type: String, default: "Growing confident learners. Building stronger futures." }, heroText: { type: String, default: "Quality education, character development and compassionate care in a community where every child is encouraged to discover their potential." }, heroImage: { type: String, default: "/images/slide1.jpg" },
    stats: { type: [statSchema], default: () => [{ value: "248+", label: "Learners served" }, { value: "24", label: "Dedicated teachers" }, { value: "94%", label: "Average attendance" }, { value: "10+", label: "Years of impact" }] },
    educationEyebrow: { type: String, default: "Education with purpose" }, educationTitle: { type: String, default: "Education that shapes character, purpose and opportunity." }, educationText: { type: String, default: "At Angels Home Education Centre, quality education, character development and compassionate care come together to help every learner discover their potential and prepare for a meaningful future." },
    pillars: { type: [pillarSchema], default: () => [{ number: "01", title: "Academic excellence", text: "Strong foundations, purposeful teaching and measurable learner progress." }, { number: "02", title: "Character & faith", text: "Discipline, integrity, compassion and leadership are woven into school life." }, { number: "03", title: "Whole-child care", text: "Pastoral support, creativity, sport and mentorship help every learner flourish." }] },
    communityEyebrow: { type: String, default: "A community built around learners" }, communityTitle: { type: String, default: "One school. One community. One future." }, communityText: { type: String, default: "Whether you are a parent, teacher, sponsor or community partner, there is a meaningful way to participate in the Angels Home journey." },
    pathways: { type: [pathwaySchema], default: () => [{ eyebrow: "For families", title: "Parents & pupils", text: "Access learning support, school information and secure portal services.", href: "/register?role=parent", action: "Explore family services" }, { eyebrow: "For educators", title: "Teachers", text: "Connect with colleagues, manage learning and communicate with families.", href: "/register?role=teacher", action: "Join our teaching community" }, { eyebrow: "For impact partners", title: "Sponsors & partners", text: "Help fund meaningful education programmes and follow the impact of your contribution.", href: "/register?role=sponsor", action: "Partner with Angels Home" }] },
    developmentEyebrow: { type: String, default: "School development fund" }, developmentTitle: { type: String, default: "Help us create more opportunities for learners." }, developmentText: { type: String, default: "Your support helps strengthen learning programmes, improve facilities and make quality education accessible to more children." }, developmentGoal: { type: String, default: "KES 18.5M" }, finalEyebrow: { type: String, default: "Ready to take the next step?" }, finalTitle: { type: String, default: "Discover what Angels Home can mean for your child." },
  },
  about: {
    title: { type: String, default: "About Angels Home Education Centre" }, intro: { type: String, default: "We are committed to providing affordable, quality and holistic education that empowers every learner to become a responsible, creative and productive member of society." }, storyTitle: { type: String, default: "Education, care and opportunity under one roof." }, story: { type: String, default: "Founded with the belief that every child deserves access to quality education, Angels Home Education Centre continues to nurture learners academically, socially and spiritually. Our school and home community brings together learning, character formation, pastoral care and practical support." }, mission: { type: String, default: "To provide Christ-centered, quality education and holistic care to orphans and vulnerable children." }, vision: { type: String, default: "To raise God-fearing leaders from the slums who will transform Kenya." }, values: { type: [String], default: () => ["Integrity", "Excellence", "Discipline", "Innovation", "Respect"] },
  },
  academics: {
    title: { type: String, default: "A strong academic foundation for a changing world." }, intro: { type: String, default: "Balanced learning, practical skills, creativity and character development designed around the needs of every learner." }, curriculumTitle: { type: String, default: "Learning with breadth, depth and purpose." }, curriculumText: { type: String, default: "Our programme combines core academic subjects with creativity, physical development, technology and values-based education." }, programmes: { type: [programmeSchema], default: () => [{ title: "Lower Primary", subjects: ["English", "Mathematics", "Environmental Activities", "Creative Arts", "Religious Education"] }, { title: "Upper Primary", subjects: ["English", "Kiswahili", "Science", "Social Studies", "Agriculture", "Mathematics", "CRE", "Art & Craft", "PHE"] }, { title: "Junior Secondary", subjects: ["English", "Kiswahili", "Science", "Social Studies", "Agriculture", "Mathematics", "CRE", "Pre-technical", "PHE", "Computer Studies"] }, { title: "Enrichment", subjects: ["Football", "Music", "Debate", "Swimming", "Leadership", "Digital skills"] }] }, feeNote: { type: String, default: "Contact admissions for the complete fee schedule and payment guidance." },
  },
  support: {
    title: { type: String, default: "Help create better opportunities for every learner." }, intro: { type: String, default: "Your support strengthens learning environments, learner welfare and programmes that help children build a hopeful future." }, priorityTitle: { type: String, default: "Where support can make a difference." }, priorities: { type: [prioritySchema], default: () => [{ title: "Infrastructure", description: "Classrooms, the home, laboratories and learning facilities.", amount: "KES 18,500,000", icon: "🏫" }, { title: "Scholarship Fund", description: "Supporting talented learners from disadvantaged families.", amount: "KES 2,000,000", icon: "🎓" }, { title: "Sports & Talent", description: "Equipment and programmes that develop confidence, teamwork and talent.", amount: "KES 1,000,000", icon: "⚽" }] }, donationText: { type: String, default: "Complete the donation form below. Payment options and confirmation are handled through the Centre's configured payment services." },
  },
  footer: { description: { type: String, default: "Empowering young minds through quality education." } },
}, { timestamps: true });

module.exports = mongoose.model("SchoolSettings", schema);
