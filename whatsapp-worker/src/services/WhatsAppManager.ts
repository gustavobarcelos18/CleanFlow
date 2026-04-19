import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from '../index';
import { supabase } from '../lib/supabase';
import { getSupabaseAuthState } from './SupabaseAuthState';

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2000;
const MAX_DELAY_MS = 60000; // Cap backoff at 60s
const QR_TTL_MS = 45000;

export class WhatsAppManager {
  private static instance: WhatsAppManager;
  private sockets: Map<string, WASocket> = new Map();
  private retryCounts: Map<string, number> = new Map();
  private qrTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private masterKey = process.env.WA_MASTER_KEY;

  private constructor() {
    if (!this.masterKey || this.masterKey.length !== 32) {
      throw new Error('WA_MASTER_KEY must be exactly 32 bytes long for AES-256.');
    }
  }

  public static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager();
    }
    return WhatsAppManager.instance;
  }

  private getBackoffTime(retryCount: number): number {
    const exponential = Math.min(MAX_DELAY_MS, BASE_BACKOFF_MS * Math.pow(2, retryCount));
    const jitter = Math.floor(Math.random() * 1000); // 0-1s jitter
    return exponential + jitter;
  }

  private clearQrTimeout(instanceId: string) {
    if (this.qrTimeouts.has(instanceId)) {
      clearTimeout(this.qrTimeouts.get(instanceId));
      this.qrTimeouts.delete(instanceId);
    }
  }

  public async connect(instanceId: string) {
    if (this.sockets.has(instanceId)) {
      return;
    }

    try {
      const { state, saveCreds } = await getSupabaseAuthState(instanceId, this.masterKey!);
      const { version, isLatest } = await fetchLatestBaileysVersion();
      
      logger.info({ instanceId, version, isLatest }, 'Starting Baileys WA Socket');

      const sock = makeWASocket({
        version,
        logger: logger as any,
        printQRInTerminal: false,
        auth: state,
        generateHighQualityLinkPreview: true,
        shouldIgnoreJid: (jid: string) => isJidBroadcast(jid),
      });

      this.sockets.set(instanceId, sock);

      // Save creds whenever updated
      sock.ev.on('creds.update', saveCreds);

      // INBOUND OMITTED (v1.2 STRICT)
      // sock.ev.on('messages.upsert', ... ) -> Explicitly not implemented to avoid scope creep for now.

      // Connection updates
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info({ instanceId }, 'QR Code generated');
          
          this.clearQrTimeout(instanceId);

          await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qr, status: 'QR_READY', updated_at: new Date().toISOString() })
            .eq('id', instanceId);

          // QR TTL
          const timeout = setTimeout(async () => {
            // Verify if it didn't connect during the 45s
            const { data } = await supabase.from('whatsapp_instances').select('status').eq('id', instanceId).single();
            if (data && data.status !== 'CONNECTED') {
              logger.info({ instanceId }, 'QR Code Expired (TTL). Removing from DB.');
              await supabase
                .from('whatsapp_instances')
                .update({ qr_code: null, status: 'DISCONNECTED', last_activity: new Date().toISOString() })
                .eq('id', instanceId);
              this.disconnect(instanceId);
            }
          }, QR_TTL_MS);

          this.qrTimeouts.set(instanceId, timeout);
        }

        if (connection === 'close') {
          this.clearQrTimeout(instanceId);
          
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          logger.warn({ instanceId, statusCode, shouldReconnect }, 'Connection closed');

          if (shouldReconnect) {
            const currentRetry = this.retryCounts.get(instanceId) || 0;

            // Database might already be in QUARANTINE if modified by UI or previous cycle, check it
            const { data: dbInstance } = await supabase.from('whatsapp_instances').select('status').eq('id', instanceId).single();
            if (dbInstance && dbInstance.status === 'QUARANTINE') {
               logger.warn({ instanceId }, 'Instance is in QUARANTINE. Will not attempt to reconnect.');
               this.retryCounts.delete(instanceId);
               this.sockets.delete(instanceId);
               return;
            }

            if (currentRetry >= MAX_RETRIES) {
              logger.error({ instanceId }, 'Max retries exhausted. Moving to QUARANTINE.');
              
              await supabase
                .from('whatsapp_instances')
                .update({ status: 'QUARANTINE', qr_code: null, updated_at: new Date().toISOString() })
                .eq('id', instanceId);
                
              this.retryCounts.delete(instanceId);
              this.sockets.delete(instanceId);
            } else {
              this.retryCounts.set(instanceId, currentRetry + 1);
              const backoff = this.getBackoffTime(currentRetry);
              
              logger.info({ instanceId, currentRetry, backoff }, 'Scheduling reconnect');

              await supabase
                .from('whatsapp_instances')
                .update({ status: 'CONNECTING', qr_code: null, updated_at: new Date().toISOString() })
                .eq('id', instanceId);
                
              this.sockets.delete(instanceId);
              setTimeout(() => this.connect(instanceId), backoff);
            }
          } else {
            logger.info({ instanceId }, 'Logged out explicitly. Removing session.');
            await supabase
              .from('whatsapp_instances')
              .update({ status: 'DISCONNECTED', qr_code: null, session_data: null, updated_at: new Date().toISOString() }) 
              .eq('id', instanceId);
              
            this.retryCounts.delete(instanceId);
            this.sockets.delete(instanceId);
          }
        } else if (connection === 'open') {
          this.clearQrTimeout(instanceId);
          this.retryCounts.delete(instanceId); // Reset retries on success

          logger.info({ instanceId }, 'Connection opened successfully');
          await supabase
            .from('whatsapp_instances')
            .update({ 
               status: 'CONNECTED', 
               qr_code: null, 
               last_activity: new Date().toISOString(),
               updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);
        }
      });

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown Error';
      logger.error({ errMsg, instanceId }, 'Error configuring socket');
      this.sockets.delete(instanceId);
    }
  }

  public async getSocket(instanceId: string): Promise<WASocket | undefined> {
    return this.sockets.get(instanceId);
  }

  public async disconnect(instanceId: string) {
    this.clearQrTimeout(instanceId);
    const sock = this.sockets.get(instanceId);
    if (sock) {
      sock.end(undefined);
      this.sockets.delete(instanceId);
    }
    this.retryCounts.delete(instanceId);
  }

  public getLoadedInstances() {
    return Array.from(this.sockets.keys());
  }
}
