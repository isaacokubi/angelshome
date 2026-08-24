import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Donations from "./pages/Donations";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { Login, Register } from "./pages/Auth";
import PortalDashboard from "./components/PortalDashboard";
import { Management, Notifications, Learning } from "./pages/PortalPages";
import Community from "./pages/Community";

function App() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");
  const isPortal = location.pathname.startsWith("/portal");
  const hideChrome = isAdminArea || isPortal || location.pathname === "/login" || location.pathname === "/register";
  return <>{!hideChrome && <Navbar />}<Routes>
    <Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/academics" element={<Academics />} /><Route path="/support" element={<Support />} /><Route path="/contact" element={<Contact />} /><Route path="/donations" element={<Donations />} />
    <Route path="/teachers" element={<Community type="teachers" />} /><Route path="/pupils" element={<Community type="pupils" />} /><Route path="/sponsors" element={<Community type="sponsors" />} />
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route path="/portal/admin" element={<PortalDashboard role="admin" />} /><Route path="/portal/teacher" element={<PortalDashboard role="teacher" />} /><Route path="/portal/pupil" element={<PortalDashboard role="pupil" />} /><Route path="/portal/sponsor" element={<PortalDashboard role="sponsor" />} /><Route path="/portal/parent" element={<PortalDashboard role="parent" />} />
    <Route path="/portal/admin/pupils" element={<Management type="pupils" />} /><Route path="/portal/admin/teachers" element={<Management type="teachers" />} /><Route path="/portal/admin/sponsors" element={<Management type="sponsors" />} /><Route path="/portal/notifications" element={<Notifications />} /><Route path="/portal/teacher/classes" element={<Learning role="teacher" />} /><Route path="/portal/pupil/learning" element={<Learning role="pupil" />} /><Route path="/portal/sponsor/impact" element={<Learning role="sponsor" />} />
    <Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /><Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
  </Routes>{!hideChrome && <Footer />}</>;
}
export default App;
