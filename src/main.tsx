import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./history_game.tsx";
import { sounds } from "./sounds";

// Unlock audio on the first user gesture (browser autoplay policy).
document.addEventListener("pointerdown", () => sounds.init(), { once: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
