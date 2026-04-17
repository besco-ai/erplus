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
import ProductionDashboardPage from './features/production/ProductionDashboardPage';
import ProductionCategoryPage from './features/production/ProductionCategoryPage';
import ConfigPage from './features/config/ConfigPage';
import AtasPage from './features/documents/AtasPage';
import SupportPage from './features/support/SupportPage';
import SuporteDashboardPage from './features/support/SuporteDashboardPage';
import HelpPage from './features/support/HelpPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ComercialDashboardPage from './features/commercial/ComercialDashboardPage';
import AdministrativoDashboardPage from './features/finance/AdministrativoDashboardPage';
import OrdemComprasPage from './features/finance/OrdemComprasPage';

// Categorias de Produção espelhando o campo ProductionItemType.Categoria do backend.
// Usado pelas 8 rotas dedicadas /producao/{slug}.
const PRODUCTION_CATEGORIES = [
  { slug: 'revisao-tecnica', key: 'revisao_tecnica', label: 'Revisão Técnica', color: '#8B5CF6' },
  { slug: 'licenciamentos', key: 'licenciamentos', label: 'Licenciamentos', color: '#F59E0B' },
  { slug: 'design', key: 'design', label: 'Design Criativo', color: '#EC4899' },
  { slug: 'projetos', key: 'projetos', label: 'Projetos', color: '#7C3AED' },
  { slug: 'incorporacoes', key: 'incorporacoes', label: 'Incorporações', color: '#3B82F6' },
  { slug: 'supervisao', key: 'supervisao', label: 'Supervisão', color: '#06B6D4' },
  { slug: 'vistorias', key: 'vistorias', label: 'Vistorias', color: '#10B981' },
  { slug: 'averbacoes', key: 'averbacoes', label: 'Averbações', color: '#F97316' },
];

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
        {/* Meu Espaço */}
        <Route index element={<DashboardPage />} />
        <Route path="agenda" element={<SchedulePage />} />
        <Route path="contatos" element={<ContactsPage />} />
        <Route path="atas" element={<AtasPage />} />
        <Route path="negociacoes" element={<PipelinePage />} />
        <Route path="minha-producao" element={<ProductionPage />} />
        <Route path="planejamentos" element={<PlanningPage />} />
        <Route path="tarefas" element={<TasksPage />} />

        {/* Administrativo */}
        <Route path="administrativo" element={<AdministrativoDashboardPage />} />
        <Route path="financeiro" element={<FinancePage />} />
        <Route path="cotacoes" element={<OrdemComprasPage />} />
        <Route path="administrativo/producao" element={<ProductionPage />} />
        <Route path="administrativo/tarefas" element={<TasksPage />} />
        <Route path="equipe" element={<TeamPage />} />

        {/* Comercial */}
        <Route path="comercial/dashboard" element={<ComercialDashboardPage />} />
        <Route path="comercial" element={<PipelinePage />} />
        <Route path="orcamentos" element={<QuotesPage />} />
        <Route path="contratos" element={<ContractsPage />} />

        {/* Produção — dashboard + empreendimentos + 8 categorias */}
        <Route path="producao" element={<ProductionDashboardPage />} />
        <Route path="empreendimentos" element={<ProjectsPage />} />
        {PRODUCTION_CATEGORIES.map((cat) => (
          <Route
            key={cat.slug}
            path={`producao/${cat.slug}`}
            element={<ProductionCategoryPage category={cat.key} label={cat.label} color={cat.color} />}
          />
        ))}

        {/* Suporte */}
        <Route path="suporte/dashboard" element={<SuporteDashboardPage />} />
        <Route path="suporte" element={<SupportPage />} />

        {/* Fixos */}
        <Route path="configuracoes" element={<ConfigPage />} />
        <Route path="ajuda" element={<HelpPage />} />

        {/* Compatibilidade com a rota antiga "Produção" genérica */}
        <Route path="prod-geral" element={<Navigate to="/producao" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
