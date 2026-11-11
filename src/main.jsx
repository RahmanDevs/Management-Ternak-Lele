import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import { StoreProvider } from "./store/Store";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
