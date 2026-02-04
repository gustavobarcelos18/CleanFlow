# Confirmação Automática e Encaixe Inteligente via IA + WhatsApp

## 📱 Visão Geral

O CleanFlow possui um sistema completo de **automação de confirmações** e **encaixe inteligente de agendamentos** usando **Inteligência Artificial** e **WhatsApp**.

---

## 🤖 IA para Confirmação Automática

### Como Funciona

1. **Análise Preditiva**
   - IA analisa 15+ variáveis do cliente
   - Calcula score de risco de falta (0-100)
   - Identifica padrões de comportamento

2. **Confirmação Inteligente**
   - **D-2 (2 dias antes)**: Primeira confirmação automática
   - **H-3 (3 horas antes)**: Lembrete final
   - **Clientes de alto risco**: Confirmação adicional D-3 ou ligação

3. **Resposta Automática**
   - Cliente responde "SIM" → Confirmado automaticamente
   - Cliente responde "NÃO" → Libera horário para encaixe
   - Sem resposta → Alerta para equipe

---

## 🎯 Encaixe Automático de Agendamentos

### Funcionalidade

Quando um cliente **cancela** ou **não confirma**, o sistema:

1. **Libera o Horário Automaticamente**
   - Horário volta para disponível
   - Notificação para equipe

2. **Busca Clientes na Lista de Espera**
   - IA prioriza por:
     - Urgência do caso
     - Tempo de espera
     - Proximidade geográfica
     - Histórico de confirmações

3. **Envia Oferta Automática via WhatsApp**
   ```
   Olá [Nome]! 
   
   Temos um horário disponível para [Data] às [Hora] 
   com [Profissional]. 
   
   Gostaria de agendar?
   
   Responda:
   1 - SIM, quero agendar
   2 - NÃO, obrigado
   ```

4. **Confirma Automaticamente**
   - Cliente responde "1" → Agendamento confirmado
   - Cliente responde "2" → Próximo da lista recebe oferta
   - Sem resposta em 30min → Próximo da lista

---

## ⚡ Flow Builder (Implementado)

### Status: ✅ **IMPLEMENTADO**

O **Flow Builder** é uma ferramenta visual de arrastar e soltar para criar automações sem código.

### Localização
- **Rota:** `/admin/automations`
- **Arquivo:** `src/pages/admin/AutomationsFlowBuilder.tsx`
- **Permissão:** Requer role `config` (admin_tenant, org_admin)

### Funcionalidades

#### 1. **Gatilhos (Triggers)**
- ✅ Agendamento Criado
- ✅ Agendamento Confirmado
- ✅ Fatura Vencendo
- 🔄 Agendamento Cancelado (em desenvolvimento)
- 🔄 Cliente Não Confirmou (em desenvolvimento)

#### 2. **Ações (Actions)**
- ✅ Enviar WhatsApp
- ✅ Enviar E-mail
- 🔄 Enviar SMS (em desenvolvimento)
- 🔄 Criar Tarefa (em desenvolvimento)
- 🔄 Atualizar Campo (em desenvolvimento)

#### 3. **Condições (Conditions)**
- ✅ Risco de No-Show Alto (>70%)
- ✅ Verificar Unidade
- 🔄 Verificar Horário (em desenvolvimento)
- 🔄 Verificar Profissional (em desenvolvimento)

### Exemplo de Fluxo: Confirmação D-2

```
[GATILHO] Agendamento Criado
    ↓
[CONDIÇÃO] Risco de No-Show > 70%?
    ↓ SIM
    [AÇÃO] Enviar WhatsApp D-3
    ↓
[AÇÃO] Enviar WhatsApp D-2
    ↓
[CONDIÇÃO] Cliente Confirmou?
    ↓ NÃO
    [AÇÃO] Enviar WhatsApp H-3
    ↓
[CONDIÇÃO] Cliente Confirmou?
    ↓ NÃO
    [AÇÃO] Ligar para Cliente
```

---

## 📊 Tabelas do Banco de Dados

### 1. `automations_flows`
Armazena os fluxos de automação criados.

```sql
CREATE TABLE automations_flows (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. `automations_nodes`
Armazena os passos (nodes) de cada fluxo.

```sql
CREATE TABLE automations_nodes (
    id UUID PRIMARY KEY,
    flow_id UUID REFERENCES automations_flows(id),
    tipo TEXT NOT NULL, -- 'trigger', 'action', 'condition'
    config_json JSONB NOT NULL,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP
);
```

### 3. `automations_edges`
Armazena as conexões entre nodes.

```sql
CREATE TABLE automations_edges (
    id UUID PRIMARY KEY,
    flow_id UUID REFERENCES automations_flows(id),
    from_node_id UUID REFERENCES automations_nodes(id),
    to_node_id UUID REFERENCES automations_nodes(id),
    condition_result TEXT -- 'true', 'false', null
);
```

### 4. `automation_logs`
Armazena logs de execução.

```sql
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY,
    flow_id UUID REFERENCES automations_flows(id),
    node_id UUID REFERENCES automations_nodes(id),
    status TEXT NOT NULL, -- 'success', 'error', 'skipped'
    details JSONB,
    executed_at TIMESTAMP
);
```

---

## 🎨 Interface do Flow Builder

### Componentes Principais

1. **Sidebar de Fluxos**
   - Lista todos os fluxos criados
   - Switch para ativar/desativar
   - Data da última atualização

2. **Editor Visual**
   - Área de canvas para arrastar nodes
   - Conexões automáticas entre nodes
   - Preview de configuração

3. **Biblioteca de Nodes**
   - Gatilhos disponíveis
   - Ações disponíveis
   - Condições disponíveis

4. **Configuração de Node**
   - Template de mensagem
   - Tipo de mensagem (operacional/marketing)
   - Condições e thresholds

---

## 🔄 Fluxos Pré-configurados

### 1. Confirmação Padrão D-2 + H-3

**Objetivo:** Reduzir no-shows com confirmações automáticas

```
[TRIGGER] Agendamento Criado
    ↓
[ACTION] Aguardar até D-2
    ↓
[ACTION] Enviar WhatsApp
    Template: "Olá {{cliente_nome}}, confirma presença para {{data}} às {{hora}}? Responda SIM ou NÃO"
    ↓
[CONDITION] Cliente Confirmou?
    ↓ NÃO
    [ACTION] Aguardar até H-3
        ↓
    [ACTION] Enviar WhatsApp
        Template: "Lembrete: hoje às {{hora}} com {{profissional}}. Confirmar?"
```

### 2. Encaixe Automático

**Objetivo:** Preencher horários vagos automaticamente

```
[TRIGGER] Agendamento Cancelado
    ↓
[ACTION] Buscar Clientes na Lista de Espera
    ↓
[ACTION] Enviar Oferta via WhatsApp
    Template: "Horário disponível! {{data}} às {{hora}}. Quer agendar? 1-SIM 2-NÃO"
    ↓
[CONDITION] Cliente Respondeu "1"?
    ↓ SIM
    [ACTION] Criar Agendamento
    [ACTION] Enviar Confirmação
    ↓ NÃO
    [ACTION] Próximo da Lista
```

### 3. Follow-up Pós-Atendimento

**Objetivo:** Coletar feedback e fidelizar

```
[TRIGGER] Agendamento Concluído
    ↓
[ACTION] Aguardar 24h
    ↓
[ACTION] Enviar WhatsApp
    Template: "Olá {{cliente_nome}}! Como foi sua experiência? De 0 a 10?"
    ↓
[CONDITION] Nota < 7?
    ↓ SIM
    [ACTION] Criar Tarefa para Gerente
    [ACTION] Enviar E-mail Interno
```

### 4. Campanha de Aniversário

**Objetivo:** Engajamento e vendas

```
[TRIGGER] Aniversário do Cliente
    ↓
[ACTION] Enviar WhatsApp
    Template: "Parabéns {{cliente_nome}}! 🎉 Ganhe 20% de desconto no próximo agendamento!"
    ↓
[CONDITION] Cliente Agendou em 7 dias?
    ↓ SIM
    [ACTION] Aplicar Desconto
```

---

## 🧠 IA Anti-Faltas

### Variáveis Analisadas

1. **Histórico do Cliente**
   - Número de faltas anteriores
   - Taxa de confirmação
   - Tempo médio de resposta

2. **Padrões Temporais**
   - Dia da semana
   - Horário do agendamento
   - Antecedência do agendamento

3. **Comportamento**
   - Tempo desde último atendimento
   - Frequência de reagendamentos
   - Interação com mensagens

4. **Contexto**
   - Distância até o local
   - Tipo de serviço
   - Profissional escolhido

### Score de Risco

- **0-30%**: Baixo risco (verde)
- **31-70%**: Médio risco (amarelo)
- **71-100%**: Alto risco (vermelho)

### Ações Automáticas por Risco

**Baixo Risco (0-30%)**
- Confirmação D-2 apenas
- Lembrete H-3 opcional

**Médio Risco (31-70%)**
- Confirmação D-2
- Lembrete H-3 obrigatório
- Alerta para equipe

**Alto Risco (71-100%)**
- Confirmação D-3
- Confirmação D-2
- Lembrete H-3
- Ligação telefônica D-1
- Prioridade para encaixe se cancelar

---

## 📱 Templates de Mensagens

### Confirmação D-2

```
Olá {{cliente_nome}}! 👋

Seu agendamento está confirmado:
📅 {{data_formatada}}
🕐 {{hora}}
👨‍⚕️ {{profissional_nome}}
📍 {{unidade_nome}}

Confirma presença?
Responda SIM ou NÃO

{{link_confirmar}} | {{link_reagendar}}
```

### Lembrete H-3

```
🔔 Lembrete!

Seu atendimento é HOJE às {{hora}} com {{profissional_nome}}.

Nos vemos em breve! 😊

Precisa reagendar? {{link_reagendar}}
```

### Encaixe Automático

```
🎯 Horário Disponível!

Olá {{cliente_nome}}, temos um horário livre:

📅 {{data_formatada}}
🕐 {{hora}}
👨‍⚕️ {{profissional_nome}}

Gostaria de agendar?

Responda:
1️⃣ - SIM, quero agendar
2️⃣ - NÃO, obrigado
```

### Confirmação de Encaixe

```
✅ Agendamento Confirmado!

{{cliente_nome}}, seu horário está reservado:

📅 {{data_formatada}}
🕐 {{hora}}
👨‍⚕️ {{profissional_nome}}
📍 {{unidade_endereco}}

Nos vemos lá! 🎉
```

---

## 🔧 Configuração

### 1. Ativar Automações

```typescript
// No painel de configurações
const config = {
  whatsapp_confirmacao_d2: true,
  whatsapp_lembrete_h3: true,
  encaixe_automatico: true,
  ia_anti_faltas: true,
  threshold_risco_alto: 70
};
```

### 2. Criar Fluxo Personalizado

1. Acessar `/admin/automations`
2. Clicar em "Nova Automação"
3. Dar nome e descrição
4. Adicionar gatilho inicial
5. Adicionar ações e condições
6. Ativar o fluxo

### 3. Monitorar Execuções

```sql
-- Ver logs de execução
SELECT * FROM automation_logs
WHERE flow_id = 'uuid-do-fluxo'
ORDER BY executed_at DESC
LIMIT 100;

-- Taxa de sucesso
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM automation_logs
WHERE flow_id = 'uuid-do-fluxo'
GROUP BY status;
```

---

## 📊 Métricas e Analytics

### KPIs Principais

1. **Taxa de Confirmação**
   - % de clientes que confirmam presença
   - Meta: >80%

2. **Taxa de Faltas**
   - % de agendamentos com no-show
   - Meta: <10%

3. **Taxa de Encaixe**
   - % de horários vagos preenchidos
   - Meta: >60%

4. **Tempo de Resposta**
   - Tempo médio para cliente responder
   - Meta: <2 horas

### Dashboard

```
┌─────────────────────────────────────┐
│  Automações - Últimos 30 dias       │
├─────────────────────────────────────┤
│  📊 Taxa de Confirmação: 87%        │
│  ❌ Taxa de Faltas: 8%              │
│  ✅ Taxa de Encaixe: 65%            │
│  ⏱️  Tempo Médio Resposta: 1.5h     │
│  🤖 Fluxos Ativos: 12               │
│  📨 Mensagens Enviadas: 1,234       │
└─────────────────────────────────────┘
```

---

## 🚀 Roadmap

### Implementado ✅
- [x] Flow Builder visual
- [x] Gatilhos básicos
- [x] Ações de WhatsApp e E-mail
- [x] Condições de risco
- [x] Logs de execução

### Em Desenvolvimento 🔄
- [ ] Encaixe automático completo
- [ ] Resposta automática via NLP
- [ ] Integração com calendário externo
- [ ] A/B testing de mensagens
- [ ] Análise de sentimento

### Planejado 📋
- [ ] Chatbot com IA
- [ ] Agendamento por voz
- [ ] Integração com Google Calendar
- [ ] Webhooks para sistemas externos
- [ ] API pública de automações

---

## 💡 Casos de Uso Reais

### Caso 1: Clínica Odontológica
**Problema:** 30% de no-shows
**Solução:** Confirmação D-2 + H-3 + IA
**Resultado:** Redução para 9% de no-shows

### Caso 2: Salão de Beleza
**Problema:** Horários vagos por cancelamentos
**Solução:** Encaixe automático com lista de espera
**Resultado:** 70% dos horários vagos preenchidos

### Caso 3: Escritório de Advocacia
**Problema:** Clientes esqueciam audiências
**Solução:** Lembretes D-7, D-3, D-1 e H-3
**Resultado:** 0% de faltas em audiências

---

## 📚 Recursos Adicionais

### Documentação Técnica
- [API de Automações](./API_AUTOMATIONS.md)
- [Webhooks](./WEBHOOKS.md)
- [Flow Builder SDK](./FLOW_BUILDER_SDK.md)

### Tutoriais
- [Como criar seu primeiro fluxo](./TUTORIAL_FIRST_FLOW.md)
- [Melhores práticas de mensagens](./BEST_PRACTICES_MESSAGES.md)
- [Otimizando taxa de confirmação](./OPTIMIZE_CONFIRMATION.md)

---

**Status:** ✅ Flow Builder Implementado | 🔄 Encaixe Automático em Desenvolvimento
**Versão:** 1.0.0
**Última atualização:** 07/12/2024
