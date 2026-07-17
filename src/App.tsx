import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/useAuth";
import LoginPage from "./auth/components/LoginPage";
import RequestAccessPage from "./auth/components/RequestAccessPage";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/solicitar-acceso" element={<RequestAccessPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;