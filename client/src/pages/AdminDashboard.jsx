import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnnouncementForm from "../components/AnnouncementForm";
import { apiRequest, clearAdminToken } from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const result = await apiRequest("/admin/dashboard");
      setData({
        totalDonations: Number(result?.totalDonations || 0),
        totalDonationAmount: Number(result?.totalDonationAmount || 0),
        totalMessages: Number(result?.totalMessages || 0),
        donations: Array.isArray(result?.donations) ? result.donations : [],
        messages: Array.isArray(result?.messages) ? result.messages : [],
      });
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) {
        clearAdminToken();
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(requestError.message || "Unable to load the dashboard.");
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function logout() {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
          <h1 className="text-3xl font-bold text-blue-900">Admin Dashboard</h1>
          <p className="mt-4 text-red-600" role="alert">{error}</p>
          <button onClick={loadDashboard} className="mt-6 bg-blue-900 text-white px-5 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-10">Loading Dashboard...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Angels Home Education Centre</p>
          <h1 className="text-4xl font-bold text-blue-900">School Administration Dashboard</h1>
        </div>
        <button onClick={logout} className="border border-blue-900 text-blue-900 px-5 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-10">
        <div className="bg-white shadow rounded-xl p-8">
          <h2 className="text-xl">Donation Records</h2>
          <p className="text-4xl font-bold text-blue-600">{data.totalDonations}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-8">
          <h2 className="text-xl">Completed Donation Value</h2>
          <p className="text-4xl font-bold text-green-600">KES {data.totalDonationAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-8">
          <h2 className="text-xl">Parent Messages</h2>
          <p className="text-4xl font-bold text-blue-600">{data.totalMessages}</p>
        </div>
      </div>

      <section className="mt-12 bg-white rounded-xl shadow p-8">
        <h2 className="text-3xl font-bold">Recent Donations</h2>
        <div className="overflow-x-auto">
          <table className="w-full mt-6">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-3 text-left">Phone</th>
                <th className="text-left">Amount</th>
                <th className="text-left">Method</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.donations.map((donation) => (
                <tr key={donation._id || donation.transactionId || `${donation.phone}-${donation.createdAt}`} className="border-b">
                  <td className="p-3">{donation.phone || "—"}</td>
                  <td>KES {Number(donation.amount || 0).toLocaleString()}</td>
                  <td>{donation.paymentMethod || "—"}</td>
                  <td>{donation.status || "Pending"}</td>
                </tr>
              ))}
              {!data.donations.length && (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">No donations recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 bg-white rounded-xl shadow p-8">
        <h2 className="text-3xl font-bold">Parent Messages</h2>
        {data.messages.map((message) => (
          <div key={message._id || `${message.email}-${message.createdAt}`} className="border-b py-5">
            <h3 className="font-bold">{message.name || "Parent"}</h3>
            {message.email && <p className="text-sm text-gray-500">{message.email}</p>}
            <p className="mt-2">{message.message || message.subject || "—"}</p>
          </div>
        ))}
        {!data.messages.length && <p className="py-6 text-gray-500">No parent messages.</p>}
      </section>

      <AnnouncementForm />
    </div>
  );
}
