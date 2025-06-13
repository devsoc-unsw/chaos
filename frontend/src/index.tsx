import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import globalStyles from "./styles/globalStyles";
import "./index.css";

globalStyles();

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
