import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class EdgeLogger {
  private supabase: any;
  private requestId: string;

  constructor(requestId?: string) {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    this.requestId = requestId || crypto.randomUUID();
  }

  async log(
    level: LogLevel,
    message: string,
    service: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      await this.supabase.rpc('log_system_event', {
        p_level: level,
        p_message: message,
        p_service: service,
        p_request_id: this.requestId,
        p_metadata: metadata
      });

      console.log(`[${level.toUpperCase()}] [${service}] ${message}`, metadata);
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  info(message: string, service: string, metadata?: Record<string, any>) {
    return this.log('info', message, service, metadata);
  }

  warn(message: string, service: string, metadata?: Record<string, any>) {
    return this.log('warn', message, service, metadata);
  }

  error(message: string, service: string, metadata?: Record<string, any>) {
    return this.log('error', message, service, metadata);
  }

  debug(message: string, service: string, metadata?: Record<string, any>) {
    return this.log('debug', message, service, metadata);
  }

  getRequestId(): string {
    return this.requestId;
  }
}
