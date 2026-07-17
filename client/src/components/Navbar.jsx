import { Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {

    const [open, setOpen] = useState(false);

    return (
        <nav className="bg-blue-900 text-white shadow-lg">

            <div className="max-w-7xl mx-auto px-5 py-4">

                <div className="flex justify-between items-center">

                    {/* Logo */}
                    <h1 className="font-bold text-xl sm:text-2xl">
                        Angels Home Education Centre
                    </h1>


                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden text-3xl focus:outline-none"
                    >
                        ☰
                    </button>


                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-6 items-center">

                        <Link
                            to="/"
                            className="hover:text-yellow-400 transition"
                        >
                            Home
                        </Link>

                        <Link
                            to="/about"
                            className="hover:text-yellow-400 transition"
                        >
                            About
                        </Link>

                        <Link
                            to="/academics"
                            className="hover:text-yellow-400 transition"
                        >
                            Academics
                        </Link>

                        <Link
                            to="/support"
                            className="hover:text-yellow-400 transition"
                        >
                            Support Us
                        </Link>

                        <Link
                            to="/contact"
                            className="hover:text-yellow-400 transition"
                        >
                            Contact
                        </Link>

                    </div>

                </div>


                {/* Mobile Menu */}
                {open && (
                    <div className="md:hidden mt-5 flex flex-col space-y-4 pb-3">

                        <Link
                            onClick={() => setOpen(false)}
                            to="/"
                            className="hover:text-yellow-400"
                        >
                            Home
                        </Link>


                        <Link
                            onClick={() => setOpen(false)}
                            to="/about"
                            className="hover:text-yellow-400"
                        >
                            About
                        </Link>


                        <Link
                            onClick={() => setOpen(false)}
                            to="/academics"
                            className="hover:text-yellow-400"
                        >
                            Academics
                        </Link>


                        <Link
                            onClick={() => setOpen(false)}
                            to="/support"
                            className="hover:text-yellow-400"
                        >
                            Support Us
                        </Link>


                        <Link
                            onClick={() => setOpen(false)}
                            to="/contact"
                            className="hover:text-yellow-400"
                        >
                            Contact
                        </Link>

                    </div>
                )}

            </div>

        </nav>
    );
}