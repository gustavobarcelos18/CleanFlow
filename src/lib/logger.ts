import { supabase } from "@/integrations/supabase/client";

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  level?: LogLevel;
  service?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private requestId: string;

  constructor() {
    this.requestId = this.generateRequestId();
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async log(message: string, options: LogOptions = {}) {
    const {
      level = 'info',
      service = 'application',
      userId,
      tenantId,
      metadata = {}
    } = options;

    try {
      await supabase.rpc('log_system_event', {
        p_level: level,
        p_message: message,
        p_service: service,
        p_request_id: this.requestId,
        p_user_id: userId,
        p_tenant_id: tenantId,
        p_metadata: metadata
      });

      // Console log em desenvolvimento
      if (import.meta.env.DEV) {
        const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`[${service}] ${message}`, metadata);
      }
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  info(message: string, options?: Omit<LogOptions, 'level'>) {
    return this.log(message, { ...options, level: 'info' });
  }

  warn(message: string, options?: Omit<LogOptions, 'level'>) {
    return this.log(message, { ...options, level: 'warn' });
  }

  error(message: string, options?: Omit<LogOptions, 'level'>) {
    return this.log(message, { ...options, level: 'error' });
  }

  debug(message: string, options?: Omit<LogOptions, 'level'>) {
    return this.log(message, { ...options, level: 'debug' });
  }

  setRequestId(id: string) {
    this.requestId = id;
  }

  getRequestId(): string {
    return this.requestId;
  }
}

export const logger = new Logger();
