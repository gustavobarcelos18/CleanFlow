export type WhatsAppStatus = 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED' | 'QUARANTINE';

export const normalizeWhatsAppStatus = (raw: string | undefined | null): WhatsAppStatus => {
  const upper = raw?.toUpperCase() || 'DISCONNECTED';
  if (['DISCONNECTED', 'CONNECTING', 'QR_READY', 'CONNECTED', 'QUARANTINE'].includes(upper)) {
    return upper as WhatsAppStatus;
  }
  return 'DISCONNECTED';
};

export interface WhatsappInstance {
  id: string;
  tenant_id: string;
  name: string;
  status: WhatsAppStatus;
  qr_code: string | null;
  last_activity: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
