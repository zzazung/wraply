import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { WebSocketProvider } from "@/providers/WebSocketProvider";

import "./styles/globals.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(

  <React.StrictMode>

    <BrowserRouter>

      <WebSocketProvider>

        <App />

      </WebSocketProvider>

    </BrowserRouter>

  </React.StrictMode>

);