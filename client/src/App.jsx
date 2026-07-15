import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Support from "./pages/Support";
import Contact from "./pages/Contact";

import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";

import AdminRoute from "./components/AdminRoute";

import Donations from "./pages/Donations";


function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/academics" element={<Academics />} />
                <Route path="/support" element={<Support />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/donations" element={<Donations />} />

   


                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />


                <Route
                    path="/admin/dashboard"

                    element={

                        <AdminRoute>

                            <AdminDashboard />

                        </AdminRoute>

                    }

                />

            </Routes>

            <Footer />
        </>
    );
}

export default App;