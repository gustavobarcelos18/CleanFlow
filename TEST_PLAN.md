# Plano de Testes Funcionais - CleanFlow

Este documento descreve o roteiro de testes para validar as principais funcionalidades do sistema CleanFlow.

## 1. Autenticação e Onboarding
- [ ] **Cadastro (Signup)**
    - [ ] Criar uma nova conta com e-mail e senha válidos.
    - [ ] Verificar se o redirecionamento para o Onboarding ocorre.
- [ ] **Login**
    - [ ] Sair da conta e fazer login novamente.
    - [ ] Testar login com senha incorreta (deve mostrar erro).
    - [ ] Testar "Esqueci minha senha" (se implementado).
- [ ] **Onboarding (Primeiro Acesso)**
    - [ ] Preencher dados do negócio (Nome, Endereço).
    - [ ] Selecionar segmento (Saúde, Jurídico, etc.).
    - [ ] Verificar se as configurações iniciais foram salvas.

## 2. Agenda e Atendimento
- [ ] **Agendamento**
    - [ ] Criar um novo agendamento para um paciente existente.
    - [ ] Criar um agendamento cadastrando um *novo* paciente na hora.
    - [ ] Verificar se o agendamento aparece na visualização (Dia/Semana).
- [ ] **Gestão de Agendamento**
    - [ ] Editar um agendamento (mudar horário ou status).
    - [ ] Cancelar um agendamento.
    - [ ] Marcar como "Concluído/Atendido".

## 3. Gestão de Pacientes
- [ ] **Listagem**
    - [ ] Verificar se a lista de pacientes carrega corretamente.
    - [ ] Testar a busca por nome ou CPF.
- [ ] **Cadastro/Edição**
    - [ ] Adicionar um novo paciente manualmente pela tela de Pacientes.
    - [ ] Editar dados de um paciente existente.
    - [ ] Verificar histórico de agendamentos do paciente.

## 4. Financeiro
- [ ] **Caixa Diário**
    - [ ] Verificar se os atendimentos concluídos aparecem no caixa.
    - [ ] Lançar uma despesa manual (ex: "Material de escritório").
    - [ ] Lançar uma receita manual.
- [ ] **Relatórios**
    - [ ] Gerar um relatório simples (ex: Faturamento do mês).

## 5. Configurações e Equipe
- [ ] **Dados da Clínica**
    - [ ] Alterar logo ou nome da clínica e salvar.
- [ ] **Gestão de Equipe**
    - [ ] Convidar um novo membro (e-mail).
    - [ ] Verificar se o convite aparece na lista de "Pendentes".
    - [ ] (Opcional) Aceitar o convite com o outro e-mail.

## 6. Suporte e Ajuda
- [ ] **Acesso**
    - [ ] Clicar em "Central de Ajuda" no menu lateral.
    - [ ] Verificar se a página carrega com as abas (FAQ, Guias, Contato).
    - [ ] Testar a navegação entre as abas.

## 7. Responsividade (Mobile)
- [ ] **Acesso Mobile**
    - [ ] Reduzir a janela do navegador para tamanho de celular.
    - [ ] Verificar se o menu lateral vira um menu "hambúrguer" ou barra inferior.
    - [ ] Tentar visualizar a agenda em tela pequena.
