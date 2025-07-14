import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Import portfolio updater for user 279838958@qq.com
import "./utils/portfolio-updater";
// Import fix portfolio function
import "./utils/fix-portfolio";

createRoot(document.getElementById("root")!).render(<App />);