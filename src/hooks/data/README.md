# Hooks de Dados (React Query)

Esta pasta contém hooks customizados para acesso a dados, utilizando `@tanstack/react-query` e o cliente Supabase unificado.

## Padrão de Nomenclatura

- `useAgenda*`: Hooks relacionados a agendamentos e calendário.
- `useFinanceiro*`: Hooks relacionados a transações, caixa e relatórios financeiros.
- `useWhatsApp*`: Hooks relacionados a mensagens e integrações com WhatsApp.
- `use*`: Outros hooks de domínio específico.

## Como usar

Exemplo:

```tsx
import { useAgendaDia } from "@/hooks/data/useAgendaDia";

function MinhaTela() {
  const { data, isLoading, error } = useAgendaDia({ date: new Date() });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay />;

  return (
    <ul>
      {data.map(item => <li key={item.id}>{item.paciente.nome}</li>)}
    </ul>
  );
}
```
