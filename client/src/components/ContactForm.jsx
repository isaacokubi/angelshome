import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submitForm(e) {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      setStatus("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch(
        "https://angelshome-1.onrender.com/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      setStatus(data.message);

      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      setStatus("Unable to send message.");
    }
  }

  return (
    <form
      onSubmit={submitForm}
      className="bg-white rounded-xl shadow-xl p-8"
    >
      <h2 className="text-3xl font-bold text-blue-900">
        Send Us A Message
      </h2>

      <label className="block mt-6 font-semibold">
        Full Name *
      </label>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-3 rounded mt-2"
        placeholder="Your name"
      />

      <label className="block mt-6 font-semibold">
        Email Address *
      </label>

      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-3 rounded mt-2"
        placeholder="example@email.com"
      />

      <label className="block mt-6 font-semibold">
        Phone Number
      </label>

      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        className="w-full border p-3 rounded mt-2"
        placeholder="07XXXXXXXX"
      />

      <label className="block mt-6 font-semibold">
        Message *
      </label>

      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        rows="5"
        className="w-full border p-3 rounded mt-2"
        placeholder="Write your message..."
      />

      <button
        type="submit"
        className="mt-8 bg-blue-900 text-white px-8 py-4 rounded-lg hover:bg-blue-800"
      >
        Send Message
      </button>

      {status && (
        <p className="mt-5 text-green-700 font-semibold">
          {status}
        </p>
      )}
    </form>
  );
}