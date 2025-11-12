// ============================================
// MELHORIA 7: Error Handling Robusto
// ============================================
// Sistema centralizado de tratamento de erros

import { StructuredLogger } from './logger.ts';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    request_id?: string;
  };
}

export class ErrorHandler {
  static handle(
    error: unknown,
    logger?: StructuredLogger,
    corsHeaders?: Record<string, string>
  ): Response {
    const timestamp = new Date().toISOString();

    // AppError (erro conhecido)
    if (error instanceof AppError) {
      logger?.error('Application error', error, {
        error_code: error.code,
        status_code: error.statusCode
      });

      const response: ErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp,
          request_id: logger?.['context']?.request_id
        }
      };

      return new Response(JSON.stringify(response), {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Error padrão do JavaScript
    if (error instanceof Error) {
      logger?.error('Unexpected error', error);

      const response: ErrorResponse = {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          details: Deno.env.get('ENVIRONMENT') === 'development' ? error.message : undefined,
          timestamp,
          request_id: logger?.['context']?.request_id
        }
      };

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Erro desconhecido
    logger?.error('Unknown error', error);

    const response: ErrorResponse = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unknown error occurred',
        timestamp,
        request_id: logger?.['context']?.request_id
      }
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  /**
   * Cria erro de validação
   */
  static validationError(message: string, details?: any): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  /**
   * Cria erro de autenticação
   */
  static authenticationError(message = 'Authentication required'): AppError {
    return new AppError(ErrorCode.AUTHENTICATION_ERROR, message, 401);
  }

  /**
   * Cria erro de autorização
   */
  static authorizationError(message = 'Access denied'): AppError {
    return new AppError(ErrorCode.AUTHORIZATION_ERROR, message, 403);
  }

  /**
   * Cria erro de não encontrado
   */
  static notFoundError(resource: string): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      404
    );
  }

  /**
   * Cria erro de API externa
   */
  static externalApiError(service: string, details?: any): AppError {
    return new AppError(
      ErrorCode.EXTERNAL_API_ERROR,
      `Error communicating with ${service}`,
      502,
      details
    );
  }

  /**
   * Cria erro de banco de dados
   */
  static databaseError(message: string, details?: any): AppError {
    return new AppError(
      ErrorCode.DATABASE_ERROR,
      message,
      500,
      details
    );
  }
}

/**
 * Wrapper para funções com tratamento de erro automático
 */
export async function withErrorHandling(
  handler: () => Promise<Response>,
  logger?: StructuredLogger,
  corsHeaders?: Record<string, string>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    return ErrorHandler.handle(error, logger, corsHeaders);
  }
}
