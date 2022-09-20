import { StrictMode } from "react";
import ReactDOM from "react-dom";

import App from "./App";
import globalStyles from "./styles/globalStyles";

globalStyles();

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
