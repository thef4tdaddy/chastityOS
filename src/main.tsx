import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { RootErrorBoundary } from "./components/errors";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
