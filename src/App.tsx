import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/useAuth";
import LoginPage from "./auth/components/LoginPage";
import RequestAccessPage from "./auth/components/RequestAccessPage";
import { queryClient } from "./shared/api/queryClient";
import "./index.css";
import PanelPage from './dashboard/components/PanelPage.tsx'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/solicitar-acceso" element={<RequestAccessPage />} />
            <Route path="/panel" element={<PanelPage/>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App;