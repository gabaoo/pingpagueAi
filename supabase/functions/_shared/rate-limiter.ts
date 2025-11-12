// ============================================
// MELHORIA 4: Rate Limiting
// ============================================
// Sistema de rate limiting para proteger contra abuso

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export class RateLimiter {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Verifica se o usuário excedeu o rate limit
   * @param userId - ID do usuário
   * @param endpoint - Nome do endpoint (ex: 'generate-pix')
   * @param config - Configuração de limite
   */
  async checkRateLimit(
    userId: string,
    endpoint: string,
    config: RateLimitConfig = { maxRequests: 10, windowMinutes: 1 }
  ): Promise<RateLimitResult> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

    try {
      // Contar requisições recentes
      const { data: rateLimits, error } = await this.supabase
        .from('rate_limits')
        .select('request_count, window_start')
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .order('window_start', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Rate limit check error:', error);
        // Em caso de erro, permitir a requisição (fail open)
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: new Date(Date.now() + config.windowMinutes * 60000)
        };
      }

      const currentCount = rateLimits && rateLimits.length > 0 
        ? rateLimits[0].request_count 
        : 0;

      if (currentCount >= config.maxRequests) {
        const resetAt = new Date(rateLimits[0].window_start);
        resetAt.setMinutes(resetAt.getMinutes() + config.windowMinutes);

        return {
          allowed: false,
          remaining: 0,
          resetAt
        };
      }

      // Incrementar contador
      await this.incrementCounter(userId, endpoint, windowStart);

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount - 1,
        resetAt: new Date(Date.now() + config.windowMinutes * 60000)
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Em caso de erro, permitir a requisição (fail open)
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(Date.now() + config.windowMinutes * 60000)
      };
    }
  }

  private async incrementCounter(
    userId: string,
    endpoint: string,
    windowStart: Date
  ): Promise<void> {
    const { error } = await this.supabase
      .from('rate_limits')
      .upsert({
        user_id: userId,
        endpoint,
        window_start: new Date().toISOString(),
        request_count: 1
      }, {
        onConflict: 'user_id,endpoint,window_start',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error incrementing rate limit counter:', error);
    }
  }

  /**
   * Limpa rate limits antigos (deve ser chamado periodicamente)
   */
  static async cleanup(supabaseClient: any): Promise<void> {
    const { error } = await supabaseClient.rpc('cleanup_old_rate_limits');
    
    if (error) {
      console.error('Error cleaning up rate limits:', error);
    }
  }
}

/**
 * Middleware para adicionar rate limiting a uma edge function
 */
export async function withRateLimit(
  req: Request,
  supabaseClient: any,
  endpoint: string,
  handler: () => Promise<Response>,
  config?: RateLimitConfig
): Promise<Response> {
  // Obter user do header de autorização
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return handler(); // Se não tem auth, deixa passar (será bloqueado por auth)
  }

  const { data: { user }, error } = await supabaseClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (error || !user) {
    return handler(); // Se não conseguiu validar, deixa passar
  }

  const rateLimiter = new RateLimiter(supabaseClient);
  const result = await rateLimiter.checkRateLimit(user.id, endpoint, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)} seconds`,
        resetAt: result.resetAt.toISOString()
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(config?.maxRequests || 10),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': result.resetAt.toISOString(),
        }
      }
    );
  }

  // Adicionar headers de rate limit na resposta
  const response = await handler();
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-RateLimit-Limit', String(config?.maxRequests || 10));
  newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
  newHeaders.set('X-RateLimit-Reset', result.resetAt.toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
