// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HeroUIProvider>
      <ToastProvider />
      <App />
    </HeroUIProvider>
  </StrictMode>
);