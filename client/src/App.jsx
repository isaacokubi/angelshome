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
import SMISOperations from "./pages/SMISOperations";
import SMISResults from "./pages/SMISResults";
import SMISFinance from "./pages/SMISFinance";
import SMISTimetable from "./pages/SMISTimetable";
import AdminTimetableBuilderV6 from "./pages/AdminTimetableBuilderV6";
import SMISOperationsHub from "./pages/SMISOperationsHub";
import SchoolReports from "./pages/SchoolReports";
import AdminCommunications from "./pages/AdminCommunications";
import PortalAttendance from "./pages/PortalAttendance";
import PortalResults from "./pages/PortalResults";
import { Login, Register } from "./pages/Auth";
import PortalDashboard from "./components/PortalDashboard";
import { Management, Notifications, Learning, AccountSettings } from "./pages/PortalPages";
import SchoolCoordination from "./pages/SchoolCoordination";
import Community from "./pages/Community";

const Guard = ({ role, children }) => <ProtectedPortal role={role}>{children}</ProtectedPortal>;
function App() {
  const location = useLocation(); const isAdminArea = location.pathname.startsWith("/admin"); const isPortal = location.pathname.startsWith("/portal"); const hideChrome = isAdminArea || isPortal;
  return <>{!hideChrome && <Navbar />}<Routes>
    <Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/academics" element={<Academics />} /><Route path="/support" element={<Support />} /><Route path="/contact" element={<Contact />} /><Route path="/donations" element={<Donations />} /><Route path="/teachers" element={<Community type="teachers" />} /><Route path="/pupils" element={<Community type="pupils" />} /><Route path="/sponsors" element={<Community type="sponsors" />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route path="/portal/admin" element={<Guard role="admin"><PortalDashboard role="admin" /></Guard>} /><Route path="/portal/teacher" element={<Guard role="teacher"><PortalDashboard role="teacher" /></Guard>} /><Route path="/portal/pupil" element={<Guard role="pupil"><PortalDashboard role="pupil" /></Guard>} /><Route path="/portal/sponsor" element={<Guard role="sponsor"><PortalDashboard role="sponsor" /></Guard>} /><Route path="/portal/parent" element={<Guard role="parent"><PortalDashboard role="parent" /></Guard>} />
    <Route path="/portal/admin/pupils" element={<Guard role="admin"><Management type="pupils" /></Guard>} /><Route path="/portal/admin/teachers" element={<Guard role="admin"><Management type="teachers" /></Guard>} /><Route path="/portal/admin/sponsors" element={<Guard role="admin"><Management type="sponsors" /></Guard>} /><Route path="/portal/admin/parents" element={<Guard role="admin"><Management type="parents" /></Guard>} /><Route path="/portal/admin/relationships" element={<Guard role="admin"><SchoolCoordination /></Guard>} /><Route path="/portal/settings" element={<Guard><AccountSettings /></Guard>} /><Route path="/portal/notifications" element={<Guard><Notifications /></Guard>} /><Route path="/portal/teacher/classes" element={<Guard role="teacher"><Learning role="teacher" /></Guard>} /><Route path="/portal/pupil/learning" element={<Guard role="pupil"><Learning role="pupil" /></Guard>} /><Route path="/portal/sponsor/impact" element={<Learning role="sponsor" />} /><Route path="/portal/timetable" element={<Guard><SMISTimetable /></Guard>} /><Route path="/portal/results" element={<Guard><PortalResults /></Guard>} />
    <Route path="/portal/admin/attendance" element={<Guard role="admin"><PortalAttendance role="admin" /></Guard>} /><Route path="/portal/teacher/attendance" element={<Guard role="teacher"><PortalAttendance role="teacher" /></Guard>} /><Route path="/portal/pupil/attendance" element={<Guard role="pupil"><PortalAttendance role="pupil" /></Guard>} /><Route path="/portal/parent/attendance" element={<Guard role="parent"><PortalAttendance role="parent" /></Guard>} /><Route path="/portal/sponsor/attendance" element={<Guard role="sponsor"><PortalAttendance role="sponsor" /></Guard>} />
    <Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /><Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} /><Route path="/admin/smis" element={<AdminRoute><SMISDashboard /></AdminRoute>} /><Route path="/admin/smis/operations" element={<AdminRoute><SMISOperations /></AdminRoute>} /><Route path="/admin/smis/operations-centre" element={<AdminRoute><SMISOperationsHub /></AdminRoute>} /><Route path="/admin/smis/results" element={<AdminRoute><SMISResults /></AdminRoute>} /><Route path="/admin/smis/finance" element={<AdminRoute><SMISFinance /></AdminRoute>} /><Route path="/admin/smis/timetable" element={<AdminRoute><AdminTimetableBuilderV6 /></AdminRoute>} /><Route path="/admin/reports" element={<AdminRoute><SchoolReports /></AdminRoute>} /><Route path="/admin/communications" element={<AdminRoute><AdminCommunications /></AdminRoute>} />
  </Routes>{!hideChrome && <Footer />}</>;
}
export default App;
