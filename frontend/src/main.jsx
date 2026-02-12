import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { App as AntApp } from "antd";
import router from "./router/Router";
import "bootstrap/dist/css/bootstrap.min.css";

// CSS
import "./main.css";
import "./styles/Forum.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AntApp>
      <RouterProvider router={router} />
    </AntApp>
  </StrictMode>
);
