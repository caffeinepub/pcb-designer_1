import React from "react";
import AppLayout from "./components/AppLayout";
import AuthenticatedApp from "./components/AuthenticatedApp";
import { PCBCanvasProvider } from "./contexts/PCBCanvasContext";

export default function App() {
  return (
    <AuthenticatedApp>
      <PCBCanvasProvider>
        <AppLayout />
      </PCBCanvasProvider>
    </AuthenticatedApp>
  );
}
