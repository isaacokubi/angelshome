import { useState } from "react";
import { apiRequest } from "../services/api";

export default function DonationForm() {
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function paypalPayment() {
    const data = await apiRequest("/paypal/create-order", {
      method: "POST",
      body: JSON.stringify({ amount, donorName, email, phone }),
    });

    if (!data?.approvalUrl) throw new Error("PayPal approval link was not returned");
    window.location.assign(data.approvalUrl);
  }

  async function mpesaPayment() {
    const data = await apiRequest("/mpesa/stkpush", {
      method: "POST",
      body: JSON.stringify({ phone, amount, donorName, email }),
    });

    if (!data?.success) throw new Error(data?.message || "Failed to send STK Push");
    setMessage("STK Push sent to your phone. Complete the payment to finalize the donation.");
  }

  async function submitDonation(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (method === "mpesa") {
        await mpesaPayment();
        setAmount("");
        setPhone("");
        setMethod("");
      } else if (method === "paypal") {
        await paypalPayment();
      } else {
        throw new Error("Select a payment method");
      }
    } catch (requestError) {
      setError(requestError.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submitDonation} className="bg-white shadow-xl rounded-xl p-8">
      <h2 className="text-3xl font-bold text-blue-900">Make A Donation</h2>

      <input
        type="text"
        placeholder="Your name (optional)"
        value={donorName}
        onChange={(event) => setDonorName(event.target.value)}
        className="w-full border p-3 rounded mt-4"
        maxLength={120}
      />

      <input
        type="email"
        placeholder="Email (optional)"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full border p-3 rounded mt-4"
      />

      <input
        type="number"
        min="1"
        step="1"
        placeholder="Enter Amount (KES)"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="w-full border p-3 rounded mt-4"
        required
      />

      <select value={method} onChange={(event) => setMethod(event.target.value)} className="w-full border p-3 rounded mt-4" required>
        <option value="">Select Payment Method</option>
        <option value="mpesa">M-PESA</option>
        <option value="paypal">PayPal</option>
      </select>

      {method === "mpesa" && (
        <input
          type="tel"
          placeholder="254712345678"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full border p-3 rounded mt-4"
          required
        />
      )}

      <button type="submit" disabled={loading} className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400">
        {loading ? "Processing..." : "Donate Now"}
      </button>

      {message && <p className="mt-4 text-green-700" role="status">{message}</p>}
      {error && <p className="mt-4 text-red-600" role="alert">{error}</p>}
    </form>
  );
}
