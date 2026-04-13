import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import LoginGeneric from "./pages/LoginGeneric";
import Home from "./pages/Home";
import Permisos from "./pages/Permisos";
import GuiaLogin from "./pages/GuiaLogin";
import GuiaCodigoLogin from "./pages/GuiaCodigoLogin";
import ExposicionSpringBoot from "./pages/ExposicionSpringBoot";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/guia-login" element={<GuiaLogin />} />
          <Route path="/guia-codigo-login" element={<GuiaCodigoLogin />} />
          <Route path="/exposicion-spring-boot" element={<ExposicionSpringBoot />} />
          <Route path="/login" element={<LoginGeneric />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/permisos" element={<Permisos />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
