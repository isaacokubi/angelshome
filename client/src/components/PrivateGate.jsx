import React, { useState } from "react";

export default function PrivateGate({ children }) {
  const [inputCode, setInputCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(
    sessionStorage.getItem("site_access") === "verified",
  );

  const handleVerify = (e) => {
    e.preventDefault();
    // Reads from Vercel environment variables
    const secureCode =
      import.meta.env.VITE_SITE_ACCESS_CODE ||
      process.env.REACT_APP_SITE_ACCESS_CODE;

    if (inputCode === secureCode) {
      sessionStorage.setItem("site_access", "verified");
      setIsAuthorized(true);
    } else {
      alert("Access Denied: Invalid Passcode");
    }
  };

  if (!isAuthorized) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "20vh",
        }}
      >
        <h2>🔒 Private Deployment</h2>
        <p>Please enter the access code to view this site.</p>
        <form onSubmit={handleVerify}>
          <input
            type="password"
            placeholder="Enter passcode"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{ padding: "8px", marginRight: "10px" }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return children;
}
