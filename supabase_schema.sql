-- ==============================================================================
-- SCHEMA SUPABASE PARA RIFAZONE
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Habilitar a extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Configurações do Organizador (Mercado Pago, Efí, Carteira, Pixel, etc.)
CREATE TABLE IF NOT EXISTS configs (
    owner_id TEXT PRIMARY KEY,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Campanhas / Rifas
CREATE TABLE IF NOT EXISTS campanhas (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    codigo TEXT,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campanhas_owner ON campanhas(owner_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_codigo ON campanhas(codigo);

-- 4. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    campanha_id TEXT NOT NULL,
    mp_payment_id TEXT,
    efi_payment_id TEXT,
    status TEXT NOT NULL, -- 'pendente', 'pago', 'expirado', 'cancelado'
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_campanha ON pedidos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_owner ON pedidos(owner_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment ON pedidos(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_efi_payment ON pedidos(efi_payment_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);

-- 5. Tabela de Cotas (Alta concorrência e reservas rápidas)
CREATE TABLE IF NOT EXISTS cotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campanha_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    status TEXT NOT NULL, -- 'livre', 'reservado', 'vendido'
    reservado_ate TIMESTAMP WITH TIME ZONE,
    pedido_id TEXT,
    comprador_id TEXT,
    comprador_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campanha_id, numero)
);
CREATE INDEX IF NOT EXISTS idx_cotas_campanha_status ON cotas(campanha_id, status);
CREATE INDEX IF NOT EXISTS idx_cotas_pedido ON cotas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_cotas_comprador ON cotas(comprador_id);

-- 6. Tabela de Compradores (Clientes que compram cotas)
CREATE TABLE IF NOT EXISTS compradores (
    whatsapp TEXT PRIMARY KEY,
    nome TEXT,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabelas de Estilos e Checkouts Personalizados
CREATE TABLE IF NOT EXISTS estilos (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_estilos_owner ON estilos(owner_id);

CREATE TABLE IF NOT EXISTS checkouts (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkouts_owner ON checkouts(owner_id);

-- 8. Financeiro (Extrato da Carteira do Sistema & Solicitações de Saque)
CREATE TABLE IF NOT EXISTS transacoes (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transacoes_owner ON transacoes(owner_id);

CREATE TABLE IF NOT EXISTS saques (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saques_owner ON saques(owner_id);

-- 9. Fila de Processamento e Mensagens (WhatsApp / Outbox)
CREATE TABLE IF NOT EXISTS fila (
    id TEXT PRIMARY KEY,
    chave_idempotencia TEXT UNIQUE,
    campanha_id TEXT,
    status TEXT NOT NULL, -- 'pendente', 'enviada', 'erro', 'cancelada'
    dados JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fila_status ON fila(status);
CREATE INDEX IF NOT EXISTS idx_fila_campanha ON fila(campanha_id);

-- Desativar RLS ou permitir acesso para que a Service Role ou Anon Key da API funcione sem bloqueios:
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE estilos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para as requisições autenticadas da aplicação:
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir tudo no configs" ON configs;
    CREATE POLICY "Permitir tudo no configs" ON configs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no campanhas" ON campanhas;
    CREATE POLICY "Permitir tudo no campanhas" ON campanhas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no pedidos" ON pedidos;
    CREATE POLICY "Permitir tudo no pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no cotas" ON cotas;
    CREATE POLICY "Permitir tudo no cotas" ON cotas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no compradores" ON compradores;
    CREATE POLICY "Permitir tudo no compradores" ON compradores FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no estilos" ON estilos;
    CREATE POLICY "Permitir tudo no estilos" ON estilos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no checkouts" ON checkouts;
    CREATE POLICY "Permitir tudo no checkouts" ON checkouts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no transacoes" ON transacoes;
    CREATE POLICY "Permitir tudo no transacoes" ON transacoes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no saques" ON saques;
    CREATE POLICY "Permitir tudo no saques" ON saques FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo no fila" ON fila;
    CREATE POLICY "Permitir tudo no fila" ON fila FOR ALL USING (true) WITH CHECK (true);
END $$;
