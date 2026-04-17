import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import TeamPage from './features/auth/TeamPage';
import ContactsPage from './features/crm/ContactsPage';
import PipelinePage from './features/commercial/PipelinePage';
import QuotesPage from './features/commercial/QuotesPage';
import ContractsPage from './features/commercial/ContractsPage';
import FinancePage from './features/finance/FinancePage';
import ProjectsPage from './features/projects/ProjectsPage';
import TasksPage from './features/tasks/TasksPage';
import PlanningPage from './features/tasks/PlanningPage';
import SchedulePage from './features/schedule/SchedulePage';
import ProductionPage from './features/production/ProductionPage';
import ConfigPage from './features/config/ConfigPage';
import AtasPage from './features/documents/AtasPage';
import SupportPage from './features/support/SupportPage';
import HelpPage from './features/support/HelpPage';
import DashboardPage from './features/dashboard/DashboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="agenda" element={<SchedulePage />} />
        <Route path="contatos" element={<ContactsPage />} />
        <Route path="atas" element={<AtasPage />} />
        <Route path="negociacoes" element={<PipelinePage />} />
        <Route path="producao" element={<ProductionPage />} />
        <Route path="planejamentos" element={<PlanningPage />} />
        <Route path="tarefas" element={<TasksPage />} />
        <Route path="financeiro" element={<FinancePage />} />
        <Route path="equipe" element={<TeamPage />} />
        <Route path="comercial" element={<PipelinePage />} />
        <Route path="orcamentos" element={<QuotesPage />} />
        <Route path="contratos" element={<ContractsPage />} />
        <Route path="empreendimentos" element={<ProjectsPage />} />
        <Route path="prod-geral" element={<ProductionPage />} />
        <Route path="suporte" element={<SupportPage />} />
        <Route path="configuracoes" element={<ConfigPage />} />
        <Route path="ajuda" element={<HelpPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
