import { useNavigate } from "react-router-dom";
import { useSchoolSettings } from "../context/SchoolSettingsContext";

export default function AdminHeader() {
  const navigate = useNavigate();
  const { settings } = useSchoolSettings();
  const { school } = settings;
  function logout() { localStorage.removeItem("adminToken"); navigate("/admin/login"); }

  return <header className="flex items-center justify-between bg-white px-8 py-4 shadow"><div><p className="text-xs font-black uppercase tracking-widest text-[var(--school-secondary)]">{school.shortName}</p><h2 className="text-2xl font-bold text-[var(--school-primary)]">Administration</h2></div><button onClick={logout} className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700">Logout</button></header>;
}
