/**
 * Utilitários para tratamento de telefones no padrão CleanFlow (Brasil/E.164 adaptativo)
 * Focado em integração com WhatsApp (wa.me)
 */

/**
 * Normaliza um número de telefone para o formato de envio do WhatsApp.
 * Regras:
 * 1. Remove tudo que não for dígito.
 * 2. Remove prefixo 00 (se existir).
 * 3. Remove prefixo 0 (se existir e não começar com 55).
 * 4. Garante o prefixo 55.
 * 5. Valida se o comprimento final é 12 (Fixo) ou 13 (Celular).
 */
export function normalizarTelefoneWhatsApp(telefoneBruto: string | null | undefined): string | null {
  if (!telefoneBruto) return null;

  // 1. Limpeza de caracteres não numéricos
  let d = telefoneBruto.replace(/\D/g, "");

  // 2. Prefixos (apenas uma vez)
  if (d.startsWith("00")) {
    d = d.substring(2);
  } else if (d.startsWith("0") && !d.startsWith("55")) {
    d = d.substring(1);
  }

  // 3. Padrão: Garantir prefixo 55
  if (!d.startsWith("55")) {
    d = "55" + d;
  }

  // 4. Validação de comprimento (12 ou 13 dígitos incluindo o 55)
  // 12: 55 + DDD(2) + 8 dítigos
  // 13: 55 + DDD(2) + 9 dígitos
  if (d.length === 12 || d.length === 13) {
    return d;
  }

  return null;
}

/**
 * Monta o link do WhatsApp (wa.me) conforme as regras de negócio.
 */
export function montarLinkWhatsApp(telefoneE164: string, mensagem: string): string {
  const base = `https://wa.me/${telefoneE164}`;
  const msgTrimmed = mensagem.trim();

  if (msgTrimmed.length === 0) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(msgTrimmed)}`;
}
