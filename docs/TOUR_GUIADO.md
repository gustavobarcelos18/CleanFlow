# Sistema de Tour Guiado - CleanFlow

## 📚 Visão Geral

O sistema de tour guiado foi implementado usando **react-joyride** para fornecer uma experiência interativa de onboarding aos novos usuários do CleanFlow.

## 🎯 Funcionalidades

### 1. Tour Automático no Primeiro Acesso
- O tour inicia automaticamente quando o usuário acessa o dashboard pela primeira vez
- Delay de 1 segundo para garantir que a página carregou completamente
- Estado persistido no localStorage via Zustand

### 2. Controle Manual do Tour
- Usuários podem reiniciar o tour a qualquer momento
- Controle disponível na página de Configurações
- Opção de marcar como "não visto" para testar novamente

### 3. Temas Adaptativos
- Estilos personalizados que se adaptam ao tema (claro/escuro)
- Cores consistentes com o design system do CleanFlow
- Overlay escuro para destacar elementos

## 📁 Estrutura de Arquivos

```
src/
├── stores/
│   └── useTourStore.ts          # Gerenciamento de estado do tour
├── components/
│   └── tour/
│       ├── GuidedTour.tsx       # Componente principal do tour
│       ├── TourControl.tsx      # Controle para configurações
│       └── tourSteps.tsx        # Definição de todos os steps
└── pages/
    └── Index.tsx                # Dashboard com tour integrado
```

## 🔧 Componentes

### useTourStore (Zustand Store)

```typescript
interface TourState {
    hasSeenTour: boolean;        // Usuário já viu o tour?
    currentTourId: string | null; // ID do tour atual
    isRunning: boolean;          // Tour está rodando?
    stepIndex: number;           // Índice do step atual
    
    startTour: (tourId: string) => void;
    endTour: () => void;
    markTourAsSeen: () => void;
    resetTour: () => void;
    setStepIndex: (index: number) => void;
}
```

### GuidedTour Component

**Props:**
- `steps`: Array de steps do react-joyride
- `tourId`: Identificador único do tour
- `run`: Controle manual de execução
- `continuous`: Tour contínuo (padrão: true)
- `showProgress`: Mostrar progresso (padrão: true)
- `showSkipButton`: Botão de pular (padrão: true)

**Recursos:**
- Estilos adaptativos por tema
- Localização em português
- Callbacks para controle de estado
- Integração com store Zustand

### TourControl Component

Componente de controle para a página de configurações:
- Botão "Iniciar Tour" / "Reiniciar Tour"
- Botão "Marcar como não visto"
- Lista de funcionalidades cobertas
- Indicador de conclusão

## 📝 Tours Disponíveis

### 1. Dashboard Tour (`dashboardTourSteps`)

**Steps:**
1. **Boas-vindas** - Introdução ao CleanFlow
2. **Visão Geral** - Cards de estatísticas
3. **Agenda** - Menu de agendamentos
4. **Pacientes** - Gestão de pacientes
5. **WhatsApp** - Automações de comunicação
6. **Financeiro** - Controle financeiro
7. **Relatórios** - Análises e métricas
8. **Configurações** - Personalização do sistema
9. **Conclusão** - Próximos passos

### 2. Agenda Tour (`agendaTourSteps`)

**Steps:**
1. Calendário de agendamentos
2. Botão novo agendamento
3. Filtros de agenda

### 3. Pacientes Tour (`pacientesTourSteps`)

**Steps:**
1. Cadastrar novo paciente
2. Busca de pacientes
3. Lista com informações importantes

### 4. Financeiro Tour (`financeiroTourSteps`)

**Steps:**
1. Resumo financeiro
2. Lançar receita
3. Lançar despesa

### 5. Configurações Tour (`configuracoesTourSteps`)

**Steps:**
1. Dados da clínica
2. Configuração WhatsApp
3. Planos e assinatura

## 🎨 Atributos data-tour

Para que o tour funcione corretamente, os elementos devem ter atributos `data-tour`:

### Dashboard
```tsx
<div data-tour="dashboard-stats">
  {/* Cards de estatísticas */}
</div>
```

### Menu Lateral (Sidebar)
```tsx
<Link to="/agenda" data-tour="menu-agenda">
<Link to="/pacientes" data-tour="menu-pacientes">
<Link to="/whatsapp-dashboard" data-tour="menu-whatsapp">
<Link to="/financeiro" data-tour="menu-financeiro">
<Link to="/relatorios" data-tour="menu-relatorios">
```

### Header
```tsx
<div data-tour="user-menu">
  {/* Menu do usuário */}
</div>
```

### Agenda
```tsx
<div data-tour="agenda-calendar">
<Button data-tour="novo-agendamento">
<div data-tour="filtros-agenda">
```

### Pacientes
```tsx
<Button data-tour="novo-paciente">
<Input data-tour="busca-paciente">
<Table data-tour="lista-pacientes">
```

### Financeiro
```tsx
<div data-tour="resumo-financeiro">
<Button data-tour="nova-receita">
<Button data-tour="nova-despesa">
```

### Configurações
```tsx
<div data-tour="config-clinica">
<div data-tour="config-whatsapp">
<div data-tour="config-planos">
```

## 🚀 Como Usar

### Integrar em uma Nova Página

```tsx
import { GuidedTour } from "@/components/tour/GuidedTour";
import { agendaTourSteps } from "@/components/tour/tourSteps";
import { useTourStore } from "@/stores/useTourStore";

function AgendaPage() {
  const { hasSeenTour, startTour } = useTourStore();

  useEffect(() => {
    // Opcional: iniciar automaticamente
    if (!hasSeenTour) {
      setTimeout(() => startTour('agenda'), 1000);
    }
  }, [hasSeenTour, startTour]);

  return (
    <div>
      {/* Conteúdo da página */}
      
      <GuidedTour 
        steps={agendaTourSteps} 
        tourId="agenda"
      />
    </div>
  );
}
```

### Criar Novos Steps

```tsx
export const meuTourSteps: Step[] = [
    {
        target: '[data-tour="meu-elemento"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">Título</h3>
                <p>Descrição do elemento</p>
            </div>
        ),
        placement: 'bottom',
    },
    // ... mais steps
];
```

### Adicionar Controle nas Configurações

```tsx
import { TourControl } from "@/components/tour/TourControl";

function ConfiguracoesPage() {
  return (
    <div>
      {/* Outras configurações */}
      
      <TourControl />
    </div>
  );
}
```

## 🎯 Boas Práticas

### 1. Conteúdo dos Steps
- **Títulos claros** com emojis para visual appeal
- **Descrições concisas** (2-3 linhas)
- **Listas com bullets** para múltiplos pontos
- **Linguagem amigável** e não técnica

### 2. Posicionamento
- Usar `placement` apropriado: 'top', 'bottom', 'left', 'right', 'center'
- Evitar cobrir elementos importantes
- Testar em diferentes tamanhos de tela

### 3. Sequência
- Começar com overview geral
- Seguir fluxo natural de uso
- Terminar com call-to-action

### 4. Performance
- Usar `disableBeacon: true` no primeiro step
- Limitar número de steps (máximo 10)
- Adicionar delay antes de iniciar

## 🔄 Fluxo de Execução

```
1. Usuário faz login
   ↓
2. Acessa dashboard
   ↓
3. useEffect verifica hasSeenTour
   ↓
4. Se false → startTour('dashboard')
   ↓
5. GuidedTour renderiza com steps
   ↓
6. Usuário completa ou pula
   ↓
7. markTourAsSeen() → hasSeenTour = true
   ↓
8. Tour não inicia automaticamente mais
```

## 📊 Métricas e Analytics

Para rastrear engajamento com o tour:

```typescript
const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data;

    // Analytics
    if (type === 'step:after') {
        // Usuário avançou para próximo step
        analytics.track('tour_step_completed', { 
            tourId, 
            stepIndex: index 
        });
    }

    if (status === STATUS.FINISHED) {
        // Usuário completou o tour
        analytics.track('tour_completed', { tourId });
    }

    if (status === STATUS.SKIPPED) {
        // Usuário pulou o tour
        analytics.track('tour_skipped', { 
            tourId, 
            stepIndex: index 
        });
    }
};
```

## 🐛 Troubleshooting

### Tour não inicia
- Verificar se `data-tour` attributes estão corretos
- Confirmar que elementos estão renderizados
- Checar console para erros

### Elementos não destacados
- Garantir que `target` no step corresponde ao `data-tour`
- Verificar se elemento está visível (não display:none)
- Testar com seletor CSS direto

### Estilos quebrados
- Confirmar que tema está sendo passado corretamente
- Verificar imports do CSS do react-joyride
- Testar em modo claro e escuro

## 📦 Dependências

```json
{
  "react-joyride": "^2.x.x",
  "zustand": "^4.x.x"
}
```

## 🎨 Customização de Estilos

```typescript
const styles: Styles = {
    options: {
        primaryColor: '#2563eb',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
    },
    tooltip: {
        borderRadius: 8,
        padding: 20,
    },
    // ... mais estilos
};
```

## 🌐 Localização

```typescript
const locale = {
    back: 'Voltar',
    close: 'Fechar',
    last: 'Finalizar',
    next: 'Próximo',
    skip: 'Pular tour',
};
```

## ✅ Checklist de Implementação

- [x] Instalar react-joyride
- [x] Criar store Zustand (useTourStore)
- [x] Criar componente GuidedTour
- [x] Criar componente TourControl
- [x] Definir steps para dashboard
- [x] Adicionar data-tour attributes
- [x] Integrar no dashboard
- [ ] Adicionar data-tour no Sidebar
- [ ] Adicionar data-tour no Header
- [ ] Criar tours para outras páginas
- [ ] Adicionar analytics tracking
- [ ] Testar em mobile
- [ ] Documentar para equipe

## 📚 Recursos Adicionais

- [React Joyride Docs](https://docs.react-joyride.com/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Design System CleanFlow](./DESIGN_SYSTEM.md)

---

**Última atualização:** 07/12/2024
**Versão:** 1.0.0
**Autor:** Equipe CleanFlow
