import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="bg-blue-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center p-5">

                <h1 className="font-bold text-2xl">
                    Angels Home Education Center
                </h1>

                <div className="space-x-6">

                    <Link
                        to="/"
                        className="hover:text-yellow-400"
                    >
                        Home
                    </Link>

                    <Link
                        to="/about"
                        className="hover:text-yellow-400"
                    >
                        About
                    </Link>

                    <Link
                        to="/academics"
                        className="hover:text-yellow-400"
                    >
                        Academics
                    </Link>

                    <Link
                        to="/support"
                        className="hover:text-yellow-400"
                    >
                        Support Us
                    </Link>

                    <Link
                        to="/contact"
                        className="hover:text-yellow-400"
                    >
                        Contact
                    </Link>

                </div>

            </div>
        </nav>
    );
}