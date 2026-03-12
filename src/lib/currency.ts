/**
 * Formata um valor numérico ou string para o formato de moeda BRL (R$ 0,00).
 * Aceita números parciais para criação de máscara durante a digitação.
 */
export function formatCurrencyBRL(value: string | number): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  // Remove tudo que não for dígito
  const cleanValue = value.replace(/\D/g, "");

  // Se estiver vazio, retorna zero formatado
  if (!cleanValue) return "R$ 0,00";

  // Converte para número considerando centavos (divide por 100)
  const numberValue = parseInt(cleanValue, 10) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
}

/**
 * Converte uma string formatada em moeda BRL de volta para um número (float).
 */
export function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;

  // Remove o símbolo R$, pontos de milhar e substitui a vírgula decimal por ponto
  const cleanValue = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}
