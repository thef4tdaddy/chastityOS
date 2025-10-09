import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initWebVitals } from "./utils/performance/webVitals";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Initialize Web Vitals performance monitoring
initWebVitals();
