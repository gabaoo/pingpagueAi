// ============================================
// MELHORIA 6: Logging Estruturado
// ============================================
// Sistema de logging estruturado para observabilidade

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogContext {
  user_id?: string;
  endpoint?: string;
  request_id?: string;
  duration_ms?: number;
  [key: string]: any;
}

export class StructuredLogger {
  private context: LogContext;
  private startTime: number;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.startTime = Date.now();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
      duration_ms: Date.now() - this.startTime
    };

    // Usar console apropriado baseado no level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        console.log(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any, data?: any): void {
    const errorData = error instanceof Error
      ? {
          error_message: error.message,
          error_stack: error.stack,
          ...data
        }
      : { error, ...data };

    this.log(LogLevel.ERROR, message, errorData);
  }

  /**
   * Cria um logger filho com contexto adicional
   */
  child(additionalContext: LogContext): StructuredLogger {
    return new StructuredLogger({
      ...this.context,
      ...additionalContext
    });
  }

  /**
   * Registra o tempo de execução de uma operação
   */
  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const opStartTime = Date.now();
    this.info(`Starting operation: ${operationName}`);

    try {
      const result = await operation();
      const duration = Date.now() - opStartTime;
      
      this.info(`Operation completed: ${operationName}`, {
        operation: operationName,
        duration_ms: duration,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - opStartTime;
      
      this.error(`Operation failed: ${operationName}`, error, {
        operation: operationName,
        duration_ms: duration,
        success: false
      });

      throw error;
    }
  }
}

/**
 * Cria um logger para uma requisição HTTP
 */
export function createRequestLogger(
  req: Request,
  endpoint: string,
  userId?: string
): StructuredLogger {
  const requestId = crypto.randomUUID();
  
  return new StructuredLogger({
    request_id: requestId,
    endpoint,
    user_id: userId,
    method: req.method,
    url: req.url,
  });
}

/**
 * Middleware para adicionar logging automático
 */
export async function withLogging(
  req: Request,
  endpoint: string,
  handler: (logger: StructuredLogger) => Promise<Response>
): Promise<Response> {
  const logger = createRequestLogger(req, endpoint);
  
  logger.info('Request received', {
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    const response = await handler(logger);
    
    logger.info('Request completed', {
      status: response.status,
      statusText: response.statusText
    });

    return response;
  } catch (error) {
    logger.error('Request failed', error);
    throw error;
  }
}
