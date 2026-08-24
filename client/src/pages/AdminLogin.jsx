import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!data?.token) {
        throw new Error("Login response did not contain an authentication token.");
      }

      localStorage.setItem("adminToken", data.token);
      const destination = location.state?.from?.pathname || "/admin/dashboard";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center px-4">
      <form onSubmit={login} className="bg-white rounded-xl shadow-xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-900">Admin Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 mt-6 rounded"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 mt-4 rounded"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 text-white mt-6 py-3 rounded disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {error && <p className="text-red-600 mt-4" role="alert">{error}</p>}
      </form>
    </div>
  );
}
