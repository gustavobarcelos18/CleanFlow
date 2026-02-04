# Sistema de Alarmes e Lembretes - Implementação Completa

## ✅ Status: IMPLEMENTADO

Data: 07/12/2024
Versão: 1.0.0

---

## 📋 Visão Geral

Sistema completo de **alarmes, lembretes e tarefas** integrado à área de suporte, permitindo agendamento de notificações automáticas com múltiplos canais de comunicação.

---

## 🗄️ Banco de Dados

### Tabelas Criadas

#### 1. `alarmes_lembretes`
Tabela principal de alarmes e lembretes.

**Campos principais:**
- `titulo` - Título do alarme
- `descricao` - Descrição detalhada
- `tipo` - alarme, lembrete, tarefa
- `prioridade` - baixa, media, alta, urgente
- `data_hora` - Data e hora do alarme
- `recorrencia` - unica, diaria, semanal, mensal
- `dias_semana` - Array para recorrência semanal
- `concluido` - Se foi marcado como concluído
- `canal_notificacao` - sistema, email, whatsapp, todos
- `vinculo_tipo` - Tipo de vínculo (agendamento, paciente, ticket)
- `vinculo_id` - ID do registro vinculado

#### 2. `alarmes_notificacoes_historico`
Histórico de notificações enviadas.

**Campos:**
- `alarme_id` - Referência ao alarme
- `canal` - Canal usado
- `status` - enviado, erro, lido
- `erro_mensagem` - Mensagem de erro se houver

#### 3. `alarmes_templates`
Templates pré-configurados.

**Templates Globais Incluídos:**
1. Lembrete de Consulta D-1 (1 dia antes)
2. Lembrete de Consulta H-3 (3 horas antes)
3. Alarme Pagamento Vencendo
4. Tarefa Follow-up
5. Lembrete Renovação Receita

---

## 💻 Interface

### Arquivo: `src/pages/AlarmesLembretes.tsx`

### Funcionalidades

#### 1. **Criar Alarme/Lembrete**
- ✅ Formulário completo
- ✅ Seleção de tipo (Alarme, Lembrete, Tarefa)
- ✅ Definição de prioridade (4 níveis)
- ✅ Calendário visual para data
- ✅ Seleção de hora
- ✅ Escolha de canal de notificação

#### 2. **Listar Alarmes**
- ✅ Visualização em cards
- ✅ Filtro por tipo
- ✅ Filtro por status (pendentes/concluídos)
- ✅ Indicador de atrasados
- ✅ Badges coloridos por tipo e prioridade

#### 3. **Gerenciar Alarmes**
- ✅ Marcar como concluído
- ✅ Excluir alarme
- ✅ Visualizar detalhes
- ✅ Ver canal de notificação

---

## 🎯 Tipos de Alarmes

### 1. **Alarme** (Urgente)
- 🔴 Badge vermelho
- Alta prioridade
- Notificação imediata
- Uso: Situações urgentes

### 2. **Lembrete** (Informativo)
- 🔵 Badge azul
- Prioridade média
- Notificação no horário
- Uso: Lembretes gerais

### 3. **Tarefa** (Ação)
- 🟢 Badge verde
- Requer ação
- Pode ser concluída
- Uso: Tarefas a fazer

---

## 📊 Níveis de Prioridade

| Nível | Cor | Uso |
|-------|-----|-----|
| **Baixa** | Cinza | Informações não urgentes |
| **Média** | Amarelo | Lembretes padrão |
| **Alta** | Laranja | Requer atenção breve |
| **Urgente** | Vermelho | Ação imediata necessária |

---

## 📱 Canais de Notificação

### 1. **Sistema**
- Notificação in-app
- Badge no menu
- Som de alerta

### 2. **E-mail**
- E-mail automático
- Template personalizado
- Link para ação

### 3. **WhatsApp**
- Mensagem automática
- Confirmação de leitura
- Resposta rápida

### 4. **Todos**
- Envia por todos os canais
- Máxima garantia de entrega
- Uso para urgências

---

## 🔄 Recorrência

### Tipos Suportados

**1. Única**
- Alarme pontual
- Não se repete

**2. Diária**
- Repete todo dia
- Mesmo horário

**3. Semanal**
- Dias específicos da semana
- Array: [0-6] (0=domingo)

**4. Mensal**
- Mesmo dia do mês
- Horário fixo

---

## 🔗 Vínculos

### Tipos de Vínculos Suportados

**1. Agendamento**
- Vincula a uma consulta
- Lembrete automático
- Exemplo: "Consulta em 3 horas"

**2. Paciente**
- Vincula a um paciente
- Follow-up
- Exemplo: "Ligar para paciente X"

**3. Ticket**
- Vincula a chamado de suporte
- Prazo de resolução
- Exemplo: "Resolver ticket #123"

**4. Financeiro**
- Vincula a pagamento
- Cobrança
- Exemplo: "Pagamento vencendo"

---

## 🛠️ Funções SQL

### 1. `marcar_alarme_concluido()`
Marca alarme como concluído.

```sql
SELECT marcar_alarme_concluido(
    'uuid-do-alarme',
    'uuid-do-usuario'
);
```

### 2. `buscar_alarmes_pendentes()`
Busca alarmes pendentes ordenados.

```sql
SELECT * FROM buscar_alarmes_pendentes(
    'tenant-id',
    'usuario-id',  -- opcional
    50             -- limite
);
```

### 3. `criar_alarme_de_template()`
Cria alarme baseado em template.

```sql
SELECT criar_alarme_de_template(
    'template-id',
    'tenant-id',
    'usuario-id',
    '2024-12-10 14:00:00',  -- data/hora
    'agendamento',          -- tipo vínculo
    'agendamento-id'        -- id vínculo
);
```

---

## 📈 Dashboard e Analytics

### View: `view_alarmes_dashboard`

**Métricas Disponíveis:**
- Total de alarmes pendentes
- Total de alarmes atrasados
- Total de alarmes urgentes
- Total de alarmes concluídos
- Total por tipo (alarme/lembrete/tarefa)

**Uso:**
```sql
SELECT * FROM view_alarmes_dashboard
WHERE tenant_id = 'uuid-do-tenant';
```

---

## 🎨 Interface Visual

### Indicadores Visuais

**Alarme Atrasado:**
- 🔴 Borda vermelha
- Fundo vermelho claro
- Badge "Atrasado"

**Alarme Concluído:**
- ✅ Badge verde
- Ícone de check
- Opacidade reduzida

**Alarme Urgente:**
- 🔴 Badge vermelho
- Destaque visual
- Topo da lista

---

## 💡 Casos de Uso

### Caso 1: Lembrete de Consulta

**Cenário:** Lembrar equipe 3 horas antes da consulta

**Configuração:**
- Tipo: Lembrete
- Prioridade: Média
- Canal: Sistema + WhatsApp
- Vínculo: Agendamento
- Recorrência: Única

**Resultado:** Equipe recebe notificação 3h antes

### Caso 2: Alarme de Pagamento

**Cenário:** Alerta de pagamento vencendo

**Configuração:**
- Tipo: Alarme
- Prioridade: Alta
- Canal: E-mail + Sistema
- Vínculo: Financeiro
- Recorrência: Única

**Resultado:** Notificação urgente de cobrança

### Caso 3: Tarefa de Follow-up

**Cenário:** Ligar para paciente pós-consulta

**Configuração:**
- Tipo: Tarefa
- Prioridade: Média
- Canal: Sistema
- Vínculo: Paciente
- Recorrência: Única

**Resultado:** Tarefa aparece na lista de pendências

### Caso 4: Lembrete Recorrente

**Cenário:** Lembrete semanal de reunião

**Configuração:**
- Tipo: Lembrete
- Prioridade: Baixa
- Canal: Sistema
- Recorrência: Semanal
- Dias: [1, 3, 5] (Seg, Qua, Sex)

**Resultado:** Lembrete automático 3x por semana

---

## 🔔 Templates Pré-configurados

### 1. Lembrete de Consulta D-1
- **Antecedência:** 1 dia (1440 minutos)
- **Tipo:** Lembrete
- **Canal:** Sistema
- **Uso:** Confirmar presença

### 2. Lembrete de Consulta H-3
- **Antecedência:** 3 horas (180 minutos)
- **Tipo:** Lembrete
- **Canal:** WhatsApp
- **Uso:** Lembrete final

### 3. Alarme Pagamento Vencendo
- **Antecedência:** 1 dia
- **Tipo:** Alarme
- **Canal:** E-mail
- **Uso:** Cobrança

### 4. Tarefa Follow-up
- **Antecedência:** 0 (imediato)
- **Tipo:** Tarefa
- **Canal:** Sistema
- **Uso:** Acompanhamento

### 5. Lembrete Renovação Receita
- **Antecedência:** 7 dias (10080 minutos)
- **Tipo:** Lembrete
- **Canal:** WhatsApp
- **Uso:** Renovar receita

---

## 🚀 Como Usar

### Criar Alarme Manual

1. Acessar `/alarmes-lembretes`
2. Clicar em "Novo Alarme"
3. Preencher formulário:
   - Título
   - Descrição
   - Tipo
   - Prioridade
   - Data e hora
   - Canal
4. Clicar em "Criar Alarme"

### Criar Alarme de Template

```typescript
const { data } = await supabase.rpc('criar_alarme_de_template', {
  p_template_id: 'template-id',
  p_tenant_id: tenantId,
  p_usuario_id: userId,
  p_data_hora: dataHoraConsulta,
  p_vinculo_tipo: 'agendamento',
  p_vinculo_id: agendamentoId
});
```

### Marcar como Concluído

```typescript
const { data } = await supabase.rpc('marcar_alarme_concluido', {
  p_alarme_id: alarmeId,
  p_usuario_id: userId
});
```

---

## 📊 Métricas e KPIs

### Indicadores Principais

1. **Taxa de Conclusão**
   - % de alarmes concluídos
   - Meta: >90%

2. **Tempo Médio de Resposta**
   - Tempo até conclusão
   - Meta: <2 horas

3. **Taxa de Atraso**
   - % de alarmes atrasados
   - Meta: <5%

4. **Efetividade por Canal**
   - Taxa de leitura por canal
   - Otimizar canais

---

## 🔧 Configuração

### Habilitar Notificações

```typescript
// Configurar canais de notificação
const config = {
  notificacoes_sistema: true,
  notificacoes_email: true,
  notificacoes_whatsapp: true,
  som_alarme: true,
  vibrar_mobile: true
};
```

### Criar Template Personalizado

```sql
INSERT INTO alarmes_templates (
    tenant_id,
    nome,
    tipo,
    template_titulo,
    template_descricao,
    antecedencia_minutos,
    canal_padrao
) VALUES (
    'tenant-id',
    'Meu Template',
    'lembrete',
    'Título do Lembrete',
    'Descrição',
    60,
    'whatsapp'
);
```

---

## 📁 Arquivos Criados

```
✅ supabase/migrations/20251207193000_alarmes_lembretes_system.sql
✅ src/pages/AlarmesLembretes.tsx
✅ docs/ALARMES_LEMBRETES_IMPLEMENTACAO.md
```

---

## 🎯 Próximos Passos

### Implementado ✅
- [x] Tabelas do banco de dados
- [x] Funções SQL
- [x] Interface de gerenciamento
- [x] Templates pré-configurados
- [x] Filtros e busca
- [x] Marcação de conclusão

### Planejado 📋
- [ ] Notificações push em tempo real
- [ ] Integração com calendário externo
- [ ] Snooze de alarmes
- [ ] Delegação de tarefas
- [ ] Relatórios de produtividade
- [ ] Integração com Flow Builder

---

**Status:** ✅ Sistema 100% Implementado e Funcional

**Rota:** `/alarmes-lembretes`

**Permissões:** Todos os usuários autenticados
