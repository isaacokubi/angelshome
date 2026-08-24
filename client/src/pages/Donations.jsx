import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DonationForm from "../components/DonationForm";
import { apiRequest } from "../services/api";

export default function Donations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentMessage, setPaymentMessage] = useState("");
  const paymentStatus = searchParams.get("paypal");
  const orderID = searchParams.get("token");
  const cancelled = paymentStatus === "cancel";

  useEffect(() => {
    if (paymentStatus !== "success" || !orderID) return undefined;

    let active = true;
    (async () => {
      try {
        const result = await apiRequest("/paypal/capture-order", {
          method: "POST",
          body: JSON.stringify({ orderID }),
        });
        if (active) {
          setPaymentMessage(result.success ? "Thank you. Your PayPal donation was completed." : "PayPal payment was not completed.");
        }
      } catch (error) {
        if (active) setPaymentMessage(error.message || "Unable to confirm PayPal payment.");
      } finally {
        if (active) setSearchParams({}, { replace: true });
      }
    })();

    return () => {
      active = false;
    };
  }, [paymentStatus, orderID, setSearchParams]);

  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      {(paymentMessage || cancelled) && (
        <div className="mb-6 rounded-lg bg-white shadow p-4 text-blue-900" role="status">
          {paymentMessage || "PayPal payment was cancelled."}
        </div>
      )}
      <DonationForm />
    </div>
  );
}
