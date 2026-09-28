import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installAuthFetch } from "./lib/accessToken";

// Before render, so no /api request can go out without the token.
installAuthFetch();

createRoot(document.getElementById("root")!).render(<App />);
