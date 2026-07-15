import { useState } from "react";

export default function DonationForm() {
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // PayPal Payment
  async function paypalPayment() {
    const response = await fetch(
      "http://localhost:5000/api/paypal/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
        }),
      }
    );

    const data = await response.json();

    if (data.orderID) {
      window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${data.orderID}`;
      return true;
    }

    return false;
  }

  // M-Pesa STK Push
  async function mpesaPayment() {
    const response = await fetch(
      "http://localhost:5000/api/mpesa/stkpush",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          amount,
          donorName: "Anonymous",
        }),
      }
    );

    const data = await response.json();

    if (data.ResponseCode === "0") {
      alert("STK Push sent to your phone.");
      return true;
    }

    alert(data.message || "Failed to send STK Push");
    return false;
  }

  // Save Donation Record
  async function saveDonation() {
    const response = await fetch(
      "http://localhost:5000/api/donations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          phone,
          paymentMethod: method.toUpperCase(),
        }),
      }
    );

    return await response.json();
  }

  // Donate Now Button Click
  async function submitDonation(e) {
    e.preventDefault();

    try {
      setLoading(true);

      let paymentSuccess = false;

      if (method === "mpesa") {
        paymentSuccess = await mpesaPayment();
      }

      if (method === "paypal") {
        paymentSuccess = await paypalPayment();
      }

      if (paymentSuccess) {
        const donation = await saveDonation();

        alert(
          donation.message || "Donation recorded successfully"
        );

        setAmount("");
        setPhone("");
        setMethod("");
      }
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submitDonation}
      className="bg-white shadow-xl rounded-xl p-8"
    >
      <h2 className="text-3xl font-bold text-blue-900">
        Make A Donation
      </h2>

      <input
        type="number"
        placeholder="Enter Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border p-3 rounded mt-4"
        required
      />

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full border p-3 rounded mt-4"
        required
      >
        <option value="">Select Payment Method</option>
        <option value="mpesa">M-PESA</option>
        <option value="paypal">PayPal</option>
      </select>

      {method === "mpesa" && (
        <input
          type="tel"
          placeholder="254712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-3 rounded mt-4"
          required
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? "Processing..." : "Donate Now"}
      </button>
    </form>
  );
}