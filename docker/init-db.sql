-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar zona horaria por defecto
SET timezone = 'UTC';

-- ============================================================================
-- TABLA: TENANTS (Multi-tenant - Escuelas/Instituciones)
-- ============================================================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  email_domain VARCHAR(255) NOT NULL UNIQUE,
  cct_code VARCHAR(20) UNIQUE,
  description TEXT,
  logo_url VARCHAR(500),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'trial', 'canceled')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  max_users INT DEFAULT 100,
  max_books INT DEFAULT 10000,
  features JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_dates CHECK (subscription_start_date <= subscription_end_date)
);

CREATE UNIQUE INDEX idx_tenants_email_domain ON public.tenants(email_domain) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_tenants_cct_code ON public.tenants(cct_code) WHERE deleted_at IS NULL AND cct_code IS NOT NULL;

-- ============================================================================
-- TABLA: USERS (Usuarios del Sistema)
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  school_id VARCHAR(50),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'librarian', 'teacher', 'student')),
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_email_per_tenant UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON public.users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON public.users(role) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLA: BOOKS (Catálogo de Libros)
-- ============================================================================
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  isbn VARCHAR(20) UNIQUE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  publisher VARCHAR(255),
  publication_year INT,
  category VARCHAR(100),
  description TEXT,
  cover_image_url VARCHAR(500),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  barcode_prefix VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_copies CHECK (available_copies <= total_copies AND available_copies >= 0)
);

CREATE INDEX idx_books_tenant_id ON public.books(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_books_isbn ON public.books(isbn) WHERE deleted_at IS NULL;
CREATE INDEX idx_books_title ON public.books(title) WHERE deleted_at IS NULL;
CREATE INDEX idx_books_category ON public.books(category) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLA: BOOK_COPIES (Ejemplares Individuales con Códigos de Barras)
-- ============================================================================
CREATE TABLE public.book_copies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  barcode VARCHAR(50) UNIQUE NOT NULL,
  serial_number VARCHAR(50),
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  location VARCHAR(100),
  shelf_position VARCHAR(50),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX idx_book_copies_barcode ON public.book_copies(tenant_id, barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_book_copies_book_id ON public.book_copies(book_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_book_copies_available ON public.book_copies(is_available) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLA: LOANS (Préstamos de Libros)
-- ============================================================================
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  book_copy_id UUID NOT NULL REFERENCES public.book_copies(id) ON DELETE RESTRICT,
  librarian_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  loan_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  returned_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  renewal_count INT DEFAULT 0,
  notes TEXT,
  offline_sync_id VARCHAR(100),
  offline_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_dates CHECK (loan_date <= due_date AND (returned_date IS NULL OR returned_date >= loan_date))
);

CREATE INDEX idx_loans_tenant_id ON public.loans(tenant_id);
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_due_date ON public.loans(due_date);
CREATE INDEX idx_loans_offline_sync_id ON public.loans(offline_sync_id) WHERE offline_sync_id IS NOT NULL;

-- ============================================================================
-- TABLA: OFFLINE_SYNC_QUEUE (Cola de Sincronización Offline)
-- ============================================================================
CREATE TABLE public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('loan', 'reservation', 'penalty')),
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  priority INT DEFAULT 0,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_error TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offline_sync_queue_tenant_id ON public.offline_sync_queue(tenant_id);
CREATE INDEX idx_offline_sync_queue_user_id ON public.offline_sync_queue(user_id);
CREATE INDEX idx_offline_sync_queue_status ON public.offline_sync_queue(status);
CREATE INDEX idx_offline_sync_queue_created_at ON public.offline_sync_queue(created_at);

-- ============================================================================
-- TABLA: AUDIT_LOG (Registro de Auditoría)
-- ============================================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_tenant_id ON public.audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- ============================================================================
-- TABLA: SESSIONS (Gestión de Sesiones JWT)
-- ============================================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  jwt_token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_expiration CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_tenant_id ON public.sessions(tenant_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);

-- ============================================================================
-- CREACIÓN DE ROLES Y PERMISOS
-- ============================================================================

-- Crear rol específico para la aplicación (no usar superuser)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'biblioteka_app') THEN
    CREATE USER biblioteka_app WITH PASSWORD 'app-secure-password-change-in-prod';
  END IF;
END
$$;

-- Otorgar permisos mínimos necesarios
GRANT USAGE ON SCHEMA public TO biblioteka_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO biblioteka_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO biblioteka_app;

-- ============================================================================
-- CONFIGURACIÓN DE SEGURIDAD E INTEGRIDAD DE DATOS
-- ============================================================================

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas principales
CREATE TRIGGER tenants_update_timestamp BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER users_update_timestamp BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER books_update_timestamp BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER loans_update_timestamp BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- ÍNDICES FINALES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX idx_tenants_subscription_status ON public.tenants(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON public.users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_books_status ON public.books(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_loans_returned_date ON public.loans(returned_date) WHERE status != 'returned';

-- ============================================================================
-- FIN DEL SCRIPT DE INICIALIZACIÓN
-- ============================================================================
