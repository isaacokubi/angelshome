import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  }

  return (
    <header className="bg-white shadow px-8 py-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-blue-900">
        Administration
      </h2>

      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
      >
        Logout
      </button>
    </header>
  );
}