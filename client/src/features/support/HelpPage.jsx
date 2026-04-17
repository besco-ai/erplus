import { HelpCircle, BookOpen, Mail, Phone, ExternalLink } from 'lucide-react';

const sections = [
  {
    title: 'Primeiros passos',
    items: [
      { q: 'Como acessar o sistema?', a: 'Use seu e-mail e senha fornecidos pelo administrador. Caso não tenha acesso, solicite ao Operador Master.' },
      { q: 'Como alterar minha senha?', a: 'Acesse seu perfil no canto superior direito e clique em "Alterar senha". A nova senha deve ter no mínimo 6 caracteres.' },
      { q: 'O que cada perfil pode fazer?', a: 'Operador Master tem acesso total. Colaborador pode acessar comercial, contatos, produção e tarefas. Visitante visualiza apenas dashboard e empreendimentos.' },
    ]
  },
  {
    title: 'Comercial',
    items: [
      { q: 'Como criar um negócio?', a: 'Acesse Comercial > Pipeline e clique em "Novo Negócio". Preencha cliente, valor e selecione o pipeline e etapa inicial.' },
      { q: 'Como mover um negócio entre etapas?', a: 'No kanban, arraste o card do negócio para a coluna da nova etapa. A movimentação é registrada automaticamente na timeline.' },
      { q: 'Como gerar um orçamento?', a: 'Abra o detalhe do negócio, vá na aba "Orçamentos" e clique em "Novo". Ao aprovar um orçamento, o contrato é gerado automaticamente.' },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      { q: 'Como registrar uma receita ou despesa?', a: 'Acesse Financeiro > Novo Lançamento. Selecione o tipo (receita/despesa), centro de custo e conta bancária.' },
      { q: 'Como ver o fluxo de caixa?', a: 'O dashboard do Financeiro mostra KPIs de receitas, despesas e saldo. Use as abas para ver contas a receber e pagar.' },
    ]
  },
  {
    title: 'Produção',
    items: [
      { q: 'Quais são as categorias de produção?', a: 'Licenciamentos, Design Criativo, Projetos, Revisão Técnica, Incorporações, Supervisões, Vistorias e Averbações.' },
      { q: 'Como acompanhar o status de um item?', a: 'Cada item passa pelos status: Não iniciado → Em andamento → Em revisão → Finalizado. Use o seletor na tabela para alterar.' },
    ]
  },
  {
    title: 'Empreendimentos',
    items: [
      { q: 'Como um empreendimento é criado?', a: 'Empreendimentos são criados automaticamente quando um negócio é marcado como "Ganho", ou manualmente pela tela de Empreendimentos.' },
      { q: 'Quais são as etapas?', a: 'Aprovação → Em projeto → Em obra → Entregue. Arraste os cards no kanban para mover entre etapas.' },
    ]
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-extrabold text-erplus-text flex items-center gap-2">
          <BookOpen size={20} /> Central de Ajuda
        </h1>
        <p className="text-sm text-erplus-text-muted mt-1">Guia rápido de uso do ERPlus</p>
      </div>

      {sections.map((section, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-erplus-accent uppercase tracking-wide mb-4">{section.title}</h2>
          <div className="space-y-4">
            {section.items.map((item, j) => (
              <div key={j}>
                <div className="flex items-start gap-2">
                  <HelpCircle size={14} className="text-erplus-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{item.q}</div>
                    <div className="text-sm text-gray-600 mt-1">{item.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Contact */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-erplus-accent uppercase tracking-wide mb-4">Contato</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail size={16} className="text-gray-400" />
            <span>suporte@egconsultorias.com.br</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Phone size={16} className="text-gray-400" />
            <span>(47) 3025-0000</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-4">
        ERPlus v1.0 — EG Projetos & Consultorias
      </div>
    </div>
  );
}
