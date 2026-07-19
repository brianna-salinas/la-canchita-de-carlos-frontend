import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth/useAuth";
import { ThemeProvider } from "./shared/theme/useTheme";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import LoginPage from "./auth/components/LoginPage";
import RequestAccessPage from "./auth/components/RequestAccessPage";
import SolicitudEnviadaPage from "./auth/components/SolicitudEnviadaPage";
import ForgotPasswordPage from "./auth/components/ForgotPasswordPage";
import NotFoundPage from "./shared/components/NotFoundPage";
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

// "/" decide destino según si ya hay sesión restaurada desde
// localStorage, en vez de mandar siempre a /login.
function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? "/panel" : "/login"} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/solicitar-acceso" element={<RequestAccessPage />} />
            <Route path="/solicitud-enviada" element={<SolicitudEnviadaPage />} />
            <Route path="/olvide-password" element={<ForgotPasswordPage />} />
            <Route path="/panel" element={<ProtectedRoute><PanelPage/></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute><CalendarioPage/></ProtectedRoute>} />
            <Route path="/calendario/nueva-reserva" element={<ProtectedRoute><NuevaReservaPage/></ProtectedRoute>} />
            <Route path="/calendario/nueva-reserva/:id/editar" element={<ProtectedRoute><NuevaReservaPage/></ProtectedRoute>} />
            <Route path="/reservas" element={<ProtectedRoute><ReservasPage/></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ClientesPage/></ProtectedRoute>} />
            <Route path="/canchas" element={<ProtectedRoute><CanchasPage/></ProtectedRoute>} />
            <Route path="/canchas/nueva" element={<ProtectedRoute><NuevaCanchaPage/></ProtectedRoute>} />
            <Route path="/canchas/:id/editar" element={<ProtectedRoute><NuevaCanchaPage/></ProtectedRoute>} />
            <Route path="/ajustes" element={<ProtectedRoute><AjustesPage/></ProtectedRoute>} />
            <Route path="/ajustes/solicitudes" element={<ProtectedRoute><SolicitudesAccesoPage/></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App;
