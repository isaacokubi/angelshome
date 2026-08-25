import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import ProtectedPortal from "./components/ProtectedPortal";
import Home from "./pages/Home";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Donations from "./pages/Donations";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import SMISDashboard from "./pages/SMISDashboard";
import { Login, Register } from "./pages/Auth";
import PortalDashboard from "./components/PortalDashboard";
import { Management, Notifications, Learning } from "./pages/PortalPages";
import SchoolCoordination from "./pages/SchoolCoordination";
import Community from "./pages/Community";

const Guard = ({ role, children }) => <ProtectedPortal role={role}>{children}</ProtectedPortal>;

function App() {
  const location = useLocation(); const isAdminArea = location.pathname.startsWith("/admin"); const isPortal = location.pathname.startsWith("/portal"); const hideChrome = isAdminArea || isPortal;
  return <>
    {!hideChrome && <Navbar />}
    <Routes>
      <Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/academics" element={<Academics />} /><Route path="/support" element={<Support />} /><Route path="/contact" element={<Contact />} /><Route path="/donations" element={<Donations />} /><Route path="/teachers" element={<Community type="teachers" />} /><Route path="/pupils" element={<Community type="pupils" />} /><Route path="/sponsors" element={<Community type="sponsors" />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
      <Route path="/portal/admin" element={<Guard role="admin"><PortalDashboard role="admin" /></Guard>} /><Route path="/portal/teacher" element={<Guard role="teacher"><PortalDashboard role="teacher" /></Guard>} /><Route path="/portal/pupil" element={<Guard role="pupil"><PortalDashboard role="pupil" /></Guard>} /><Route path="/portal/sponsor" element={<Guard role="sponsor"><PortalDashboard role="sponsor" /></Guard>} /><Route path="/portal/parent" element={<Guard role="parent"><PortalDashboard role="parent" /></Guard>} />
      <Route path="/portal/admin/pupils" element={<Guard role="admin"><Management type="pupils" /></Guard>} /><Route path="/portal/admin/teachers" element={<Guard role="admin"><Management type="teachers" /></Guard>} /><Route path="/portal/admin/sponsors" element={<Guard role="admin"><Management type="sponsors" /></Guard>} /><Route path="/portal/admin/parents" element={<Guard role="admin"><Management type="parents" /></Guard>} /><Route path="/portal/admin/relationships" element={<Guard role="admin"><SchoolCoordination /></Guard>} /><Route path="/portal/notifications" element={<Guard><Notifications /></Guard>} /><Route path="/portal/teacher/classes" element={<Guard role="teacher"><Learning role="teacher" /></Guard>} /><Route path="/portal/pupil/learning" element={<Guard role="pupil"><Learning role="pupil" /></Guard>} /><Route path="/portal/sponsor/impact" element={<Guard role="sponsor"><Learning role="sponsor" /></Guard>} />
      <Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /><Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} /><Route path="/admin/smis" element={<AdminRoute><SMISDashboard /></AdminRoute>} />
    </Routes>
    {!hideChrome && <Footer />}
  </>;
}
export default App;
