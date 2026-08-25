import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SchoolSettingsProvider } from "./context/SchoolSettingsContext";
import ThemeProvider from "./components/ThemeProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolSettingsProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SchoolSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
