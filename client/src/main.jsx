import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SchoolSettingsProvider } from "./context/SchoolSettingsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolSettingsProvider>
        <App />
      </SchoolSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
