import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { WebApp } from "./WebApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebApp />
  </StrictMode>,
);
