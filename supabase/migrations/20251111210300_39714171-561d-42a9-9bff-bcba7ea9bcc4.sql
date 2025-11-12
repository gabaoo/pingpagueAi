-- ============================================
-- MELHORIA 1: Sistema de Roles e Permissões
-- ============================================
-- Problema: Qualquer usuário autenticado pode acessar qualquer dado
-- Solução: Sistema robusto de roles com SECURITY DEFINER function

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para verificar role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MELHORIA 3: Índices de Performance
-- ============================================
-- Problema: Queries lentas sem índices adequados
-- Solução: Criar índices compostos para queries frequentes

-- Índices para charges (queries por usuário + status + data)
CREATE INDEX IF NOT EXISTS idx_charges_user_status 
  ON public.charges(user_id, status) 
  WHERE status != 'canceled';

CREATE INDEX IF NOT EXISTS idx_charges_user_due_date 
  ON public.charges(user_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_charges_status_due_date 
  ON public.charges(status, due_date) 
  WHERE status = 'pending';

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_user_name 
  ON public.clients(user_id, name);

CREATE INDEX IF NOT EXISTS idx_clients_phone 
  ON public.clients(phone);

-- Índices para pix_charges
CREATE INDEX IF NOT EXISTS idx_pix_charges_user_status 
  ON public.pix_charges(user_id, status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pix_charges_vencimento 
  ON public.pix_charges(vencimento) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pix_charges_txid 
  ON public.pix_charges(txid);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_sent_at 
  ON public.notifications(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_charge 
  ON public.notifications(charge_id);

-- ============================================
-- MELHORIA 9: Auditoria e Logs
-- ============================================
-- Problema: Falta de rastreamento de ações críticas
-- Solução: Tabela de auditoria para operações sensíveis

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
  ON public.audit_logs(table_name, record_id);

-- Habilitar RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sistema pode inserir logs (service role)
CREATE POLICY "Service can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- MELHORIA 10: Rate Limiting Table
-- ============================================
-- Problema: Sem proteção contra abuso de API
-- Solução: Tabela para tracking de rate limiting

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Índice para rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint 
  ON public.rate_limits(user_id, endpoint, window_start DESC);

-- Auto-cleanup de rate limits antigos (mais de 1 hora)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '1 hour';
END;
$$;

-- ============================================
-- MELHORIA 8: Segurança Adicional
-- ============================================
-- Adicionar campos de segurança aos profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Função para registrar login
CREATE OR REPLACE FUNCTION public.register_user_login(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1
  WHERE id = _user_id;
END;
$$;