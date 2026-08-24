import { useState } from "react";
import { apiRequest } from "../services/api";

export default function AnnouncementForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/admin/announcement", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      setMessage(data?.message || "Announcement published successfully.");
      setTitle("");
      setContent("");
    } catch (requestError) {
      setError(requestError.message || "Unable to publish announcement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white shadow rounded-xl p-8 mt-10">
      <h2 className="text-3xl font-bold text-blue-900">Publish Announcement</h2>
      <input
        className="w-full border p-3 mt-6 rounded"
        placeholder="Announcement title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        required
      />
      <textarea
        className="w-full border p-3 mt-4 rounded"
        rows="5"
        placeholder="Announcement details"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={5000}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-900 text-white px-8 py-3 rounded mt-5 disabled:opacity-60"
      >
        {loading ? "Publishing..." : "Publish"}
      </button>
      {message && <p className="mt-4 text-green-700" role="status">{message}</p>}
      {error && <p className="mt-4 text-red-600" role="alert">{error}</p>}
    </form>
  );
}
