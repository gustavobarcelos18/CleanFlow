import pino from 'pino';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Logger (Safe, censors payloads locally)
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', 
    options: { colorize: true },
  },
});

import { WhatsAppManager } from './services/WhatsAppManager';
import { QueueProcessor } from './services/QueueProcessor';
import { supabase } from './lib/supabase';

const DAEMON_POLL_INTERVAL = 5000;
let isDaemonRunning = true;

async function bootZombieCleaner() {
  logger.info('Running boot obsolescence check...');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase
    .from('whatsapp_instances')
    .update({ status: 'DISCONNECTED', qr_code: null, updated_at: new Date().toISOString() })
    .in('status', ['CONNECTING', 'CONNECTED', 'QR_READY'])
    .lt('last_activity', oneHourAgo);

  if (error) {
    logger.error({ errMsg: error.message }, 'Failed to run boot checker');
  } else {
    logger.info('Cleaned obsolete zombie sessions.');
  }
}

async function daemonPollLoop() {
  if (!isDaemonRunning) return;
  
  try {
    const waManager = WhatsAppManager.getInstance();
    
    // 1. Fetch requested instances
    const { data: requestedToConnect, error: err1 } = await supabase
      .from('whatsapp_instances')
      .select('id, status')
      .eq('status', 'CONNECTING');

    if (err1) {
      logger.error({ errMsg: err1.message }, 'Daemon poll failed fetching CONNECTING instances');
    } else if (requestedToConnect) {
      const activeMemIds = waManager.getLoadedInstances();
      for (const instance of requestedToConnect) {
        if (!activeMemIds.includes(instance.id)) {
          logger.info({ id: instance.id }, 'Found connection intent. Booting instance.');
          waManager.connect(instance.id);
        }
      }
    }

    // We explicitly do not react to DISCONNECTED or QUARANTINE states automatically here,
    // to respect the boundary of letting only intentional CONNECTING triggers to activate logic.
    // Disconnection happens via graceless socket drop on the UI sending API commands elsewhere
    // or naturally terminating the Node process.

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Error';
    logger.error({ errMsg: message }, 'Daemon encountered unexpected error');
  }

  if (isDaemonRunning) {
    setTimeout(daemonPollLoop, DAEMON_POLL_INTERVAL);
  }
}

let processor: QueueProcessor | null = null;

async function start() {
  logger.info('Starting WhatsApp Worker Daemon (v1.2 Strict)');
  await bootZombieCleaner();
  processor = new QueueProcessor();
  daemonPollLoop();
}

async function shutdown() {
  logger.info('Graceful shutdown initiated...');
  isDaemonRunning = false;
  if (processor) {
    processor.stop();
  }
  
  const waManager = WhatsAppManager.getInstance();
  const loadedIds = waManager.getLoadedInstances();
  for (const id of loadedIds) {
    await waManager.disconnect(id);
  }
  
  logger.info('All sockets disconnected. Exiting process.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
