import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { PrivateRoute } from './components/PrivateRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastroToners from './pages/CadastroToners';
import CadastroUnidades from './pages/CadastroUnidades';
import CadastroFormulariosAuditoria from './pages/CadastroFormulariosAuditoria';
import RegistroRetornados from './pages/RegistroRetornados';
import ConsultaToners from './pages/ConsultaToners';
import ConsultaUnidades from './pages/ConsultaUnidades';
import ConsultaRetornados from './pages/ConsultaRetornados';
import RegistroGarantias from './pages/RegistroGarantias';
import ConsultaGarantias from './pages/ConsultaGarantias';
import TCO from './pages/TCO';
import ConsultaTCO from './pages/ConsultaTCO';
import RegistroNC from './pages/RegistroNC';
import ConsultaNC from './pages/ConsultaNC';
import RegistroAuditoria from './pages/RegistroAuditoria';
import ConsultaAuditorias from './pages/ConsultaAuditorias';
import Graficos from './pages/Graficos';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              
              {/* Cadastros */}
              <Route path="cadastro-toners" element={<CadastroToners />} />
              <Route path="cadastro-unidades" element={<CadastroUnidades />} />
              <Route path="cadastro-formularios-auditoria" element={<CadastroFormulariosAuditoria />} />
              
              {/* Registros */}
              <Route path="registro-retornados" element={<RegistroRetornados />} />
              <Route path="registro-garantias" element={<RegistroGarantias />} />
              <Route path="tco" element={<TCO />} />
              <Route path="registro-nc" element={<RegistroNC />} />
              <Route path="registro-auditoria" element={<RegistroAuditoria />} />
              
              {/* Consultas */}
              <Route path="consulta-toners" element={<ConsultaToners />} />
              <Route path="consulta-unidades" element={<ConsultaUnidades />} />
              <Route path="consulta-retornados" element={<ConsultaRetornados />} />
              <Route path="consulta-garantias" element={<ConsultaGarantias />} />
              <Route path="consulta-tco" element={<ConsultaTCO />} />
              <Route path="consulta-nc" element={<ConsultaNC />} />
              <Route path="consulta-auditorias" element={<ConsultaAuditorias />} />
              
              {/* Gráficos */}
              <Route path="graficos" element={<Graficos />} />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;