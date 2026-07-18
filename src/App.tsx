import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/useAuth";
import LoginPage from "./auth/components/LoginPage";
import RequestAccessPage from "./auth/components/RequestAccessPage";
import ForgotPasswordPage from "./auth/components/ForgotPasswordPage";
import { queryClient } from "./shared/api/queryClient";
import "./index.css";
import PanelPage from './dashboard/components/PanelPage.tsx'
import CalendarioPage from './bookings/components/CalendarioPage.tsx'
import NuevaReservaPage from './bookings/components/NuevaReservaPage.tsx'
import ReservasPage from './bookings/components/ReservasPage.tsx'
import ClientesPage from './customers/components/ClientesPage.tsx'
import CanchasPage from './courts/components/CanchasPage.tsx'
import NuevaCanchaPage from './courts/components/NuevaCanchaPage.tsx'
import AjustesPage from './settings/components/AjustesPage.tsx'
import SolicitudesAccesoPage from './settings/components/SolicitudesAccesoPage.tsx'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/solicitar-acceso" element={<RequestAccessPage />} />
            <Route path="/olvide-password" element={<ForgotPasswordPage />} />
            <Route path="/panel" element={<PanelPage/>} />
            <Route path="/calendario" element={<CalendarioPage/>} />
            <Route path="/calendario/nueva-reserva" element={<NuevaReservaPage/>} />
            <Route path="/reservas" element={<ReservasPage/>} />
            <Route path="/clientes" element={<ClientesPage/>} />
            <Route path="/canchas" element={<CanchasPage/>} />
            <Route path="/canchas/nueva" element={<NuevaCanchaPage/>} />
            <Route path="/canchas/:id/editar" element={<NuevaCanchaPage/>} />
            <Route path="/ajustes" element={<AjustesPage/>} />
            <Route path="/ajustes/solicitudes" element={<SolicitudesAccesoPage/>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App;