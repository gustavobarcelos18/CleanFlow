import { logger } from '../index';
import { supabase } from '../lib/supabase';
import { WhatsAppManager } from './WhatsAppManager';
import { AnyMessageContent } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import crypto from 'node:crypto';

const WORKER_ID = crypto.randomUUID();
const BATCH_SIZE = 10;
const POLL_INTERVAL = 10000;

export class QueueProcessor {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.start();
  }

  public start() {
    if (this.timer) return;
    logger.info({ workerId: WORKER_ID }, 'Started QueueProcessor');
    this.timer = setInterval(() => this.processQueue(), POLL_INTERVAL);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private isTransientError(error: unknown): boolean {
    if (error instanceof Boom) {
      const status = error.output?.statusCode;
      if (status && (status >= 500 || status === 408 || status === 429)) return true;
      return false;
    }
    
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (msg.includes('timeout') || msg.includes('network') || msg.includes('connection closed') || msg.includes('not connected')) {
      return true;
    }

    return false;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Claim jobs via Supabase RPC (SKIP LOCKED) with real leasing
      const { data: jobs, error } = await supabase.rpc('claim_whatsapp_jobs', {
        p_worker_id: WORKER_ID,
        p_limit: BATCH_SIZE,
      });

      if (error) {
        logger.error({ errMsg: error.message }, 'Failed to claim WhatsApp jobs');
        this.isProcessing = false;
        return;
      }

      if (!jobs || jobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info({ count: jobs.length }, 'Processing WhatsApp jobs');

      const waManager = WhatsAppManager.getInstance();

      // 2. Process each job
      for (const job of jobs) {
        try {
          if (!job.instance_id) {
            throw new Error('Permanent: Job has no instance_id assigned');
          }

          const socket = await waManager.getSocket(job.instance_id);

          if (!socket) {
            throw new Error(`Transient: Instance ${job.instance_id} is not loaded (Offline)`);
          }

          const jid = job.phone_number.includes('@s.whatsapp.net') 
            ? job.phone_number 
            : `${job.phone_number}@s.whatsapp.net`;

          let messagePayload: AnyMessageContent;
          if (job.message_type === 'text') {
            const textContent = job.content?.text || job.content?.message || 'Empty Message';
            messagePayload = { text: textContent };
          } else {
            logger.warn({ type: job.message_type, jobId: job.id }, 'Unsupported message type, falling back to JSON text');
            messagePayload = { text: JSON.stringify(job.content) };
          }

          // 3. Send message via Baileys
          await socket.sendMessage(jid, messagePayload);
          logger.info({ jobId: job.id, tenantId: job.tenant_id }, 'Message sent via Baileys');

          // 4. Billing Atomic Debit
          const priceUnit = 0.05; 
          const idempotencyKey = `transact_wa_${job.id}`;

          const { data: debited, error: rpcError } = await supabase.rpc('mark_message_sent_and_debit', {
            p_queue_id: job.id,
            p_tenant_id: job.tenant_id,
            p_price_unit: priceUnit,
            p_idempotency_key: idempotencyKey
          });

          // Strict Billing check
          if (rpcError || debited === false) {
             const billErrorMsg = rpcError ? rpcError.message : 'Debit returned false';
             logger.error({ errMsg: billErrorMsg, jobId: job.id, tenantId: job.tenant_id }, 'Message sent but failed to debit/update DB');
             
             // Fail job immediately to avoid double sending, since it ACTUALLY sent!
             await supabase.from('whatsapp_queue').update({
                 status: 'FAILED',
                 error_log: `Billing Failed: ${billErrorMsg}`,
                 locked_at: null, locked_by: null, lock_expires_at: null
             }).eq('id', job.id);
             continue; // Move to next job, do NOT fall into catch block
          }

        } catch (jobError: unknown) {
          const errMsg = jobError instanceof Error ? jobError.message : String(jobError);
          logger.error({ errMsg, jobId: job.id, tenantId: job.tenant_id }, 'Error processing individual job');
          
          const maxRetries = job.max_retries || 3;
          const currentRetries = job.retry_count || 0;
          
          const isTransient = this.isTransientError(jobError);
          const reachedMaxRetries = currentRetries >= maxRetries;

          if (isTransient && !reachedMaxRetries) {
            const newRetryCount = currentRetries + 1;
            const backoffMinutes = Math.pow(2, newRetryCount);
            const nextScheduled = new Date(Date.now() + backoffMinutes * 60000).toISOString();

            logger.info({ jobId: job.id, tenantId: job.tenant_id, newRetryCount }, 'Transient error. Re-queueing with backoff.');

            await supabase
              .from('whatsapp_queue')
              .update({ 
                 status: 'PENDING', 
                 error_log: errMsg,
                 retry_count: newRetryCount,
                 scheduled_at: nextScheduled,
                 locked_at: null, locked_by: null, lock_expires_at: null
              })
              .eq('id', job.id);
          } else {
            logger.warn({ jobId: job.id, tenantId: job.tenant_id }, 'Permanent failure or max retries exhausted. Marking FAILED.');
            
            await supabase
              .from('whatsapp_queue')
              .update({ 
                 status: 'FAILED', 
                 error_log: errMsg,
                 retry_count: currentRetries + 1,
                 locked_at: null, locked_by: null, lock_expires_at: null
              })
              .eq('id', job.id);
          }
        }
      }

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown Queue error';
      logger.error({ errMsg }, 'Unexpected error in processQueue cycle');
    } finally {
      this.isProcessing = false;
    }
  }
}
