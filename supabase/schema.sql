-- =====================================================================
-- 💑 BANCO DE DADOS: FINANÇAS CASAL DUARTE (Felipe & Genivânia Duarte)
-- SCHEMA COMPLETO SUPABASE / POSTGRESQL COM MÓDULOS DE COMBUSTÍVEL
-- =====================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 2. TABELA: users (Casal Duarte)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_color TEXT DEFAULT '#2563eb',
    papel TEXT DEFAULT 'casal',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Inserção dos usuários reais do casal
INSERT INTO public.users (id, nome, email, avatar_color, papel)
VALUES 
    ('usr-felipe', 'Felipe Duarte', 'felipemd114@gmail.com', '#2563eb', 'casal'),
    ('usr-genivania', 'Genivânia Duarte', 'genivaniaduarte@gmail.com', '#ec4899', 'casal')
ON CONFLICT (id) DO UPDATE 
SET nome = EXCLUDED.nome, email = EXCLUDED.email, avatar_color = EXCLUDED.avatar_color;

-- =====================================================================
-- 3. TABELA: categories (Macro-Categorias Financeiras)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    cor TEXT NOT NULL,
    icone TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- 4. TABELA: subcategories (Subcategorias Orçamentárias)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.subcategories (
    id TEXT PRIMARY KEY,
    categoria_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    limite_padrao NUMERIC(12, 2) DEFAULT 0,
    cor TEXT,
    icone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_subcategories_cat ON public.subcategories(categoria_id);

-- =====================================================================
-- 5. TABELA: establishments (Locais de Compra, Postos, Mercados, Farmácias)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.establishments (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Supermercado', 'Farmácia', 'Posto de combustível', 'Oficina', 'Restaurante/Lazer', 'Serviços', 'Outros')),
    cidade TEXT DEFAULT 'São Paulo',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_establishments_tipo ON public.establishments(tipo);

-- =====================================================================
-- 6. TABELA: vehicles (Veículos da Família Duarte)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    modelo TEXT NOT NULL,
    placa TEXT NOT NULL UNIQUE,
    ano INTEGER,
    odometro_atual INTEGER NOT NULL DEFAULT 0,
    motorista_principal_id TEXT REFERENCES public.users(id),
    custos_fixos_rateados_km NUMERIC(6, 2) DEFAULT 0.53, -- Custo estimado de IPVA + Seguro + Manutenção por km rodado
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- 7. TABELA: transactions (Extrato Financeiro Completo)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    usuario_id TEXT REFERENCES public.users(id),
    data DATE NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL, -- formato: 'YYYY-MM'
    valor NUMERIC(12, 2) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('despesa', 'receita')),
    forma_pagamento TEXT NOT NULL DEFAULT 'Cartão de Crédito',
    status TEXT NOT NULL CHECK (status IN ('pago', 'previsto', 'pendente')) DEFAULT 'pago',
    categoria_id TEXT NOT NULL REFERENCES public.categories(id),
    subcategoria_id TEXT NOT NULL REFERENCES public.subcategories(id),
    estabelecimento_id TEXT REFERENCES public.establishments(id),
    estabelecimento_nome TEXT,
    observacoes TEXT,
    comprovante_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_transactions_mes ON public.transactions(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_transactions_data ON public.transactions(data);
CREATE INDEX IF NOT EXISTS idx_transactions_subcat ON public.transactions(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(usuario_id);

-- =====================================================================
-- 8. TABELA: purchase_items (Itens Detalhados de Cupons e Supermercado)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id TEXT PRIMARY KEY,
    transacao_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    nome_do_item TEXT NOT NULL,
    categoria_item TEXT NOT NULL DEFAULT 'alimento',
    quantidade NUMERIC(10, 3) NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(12, 2) NOT NULL,
    preco_total NUMERIC(12, 2) NOT NULL,
    unidade TEXT DEFAULT 'un',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_tx ON public.purchase_items(transacao_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_cat ON public.purchase_items(categoria_item);

-- =====================================================================
-- 9. TABELA: receipts (Cupons e Comprovantes Fiscais OCR Gemini)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    transacao_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
    estabelecimento_nome TEXT,
    estabelecimento_tipo TEXT,
    data DATE,
    valor_total NUMERIC(12, 2),
    numero_cupom TEXT,
    status TEXT NOT NULL CHECK (status IN ('Conciliado', 'Pendente Vinculação', 'Processando')) DEFAULT 'Conciliado',
    imagem_url TEXT,
    dados_brutos TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- 10. TABELA: fuel_logs (Módulo de Combustível e Odômetro Veicular)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id TEXT PRIMARY KEY,
    veiculo_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    usuario_id TEXT REFERENCES public.users(id),
    data DATE NOT NULL,
    posto_id TEXT REFERENCES public.establishments(id),
    posto_nome TEXT NOT NULL,
    combustivel TEXT NOT NULL CHECK (combustivel IN ('Gasolina Comum', 'Gasolina Aditivada', 'Etanol', 'Diesel')),
    valor_total NUMERIC(10, 2) NOT NULL,
    preco_litro NUMERIC(6, 3) NOT NULL,
    litros NUMERIC(8, 3) NOT NULL,
    km_atual INTEGER NOT NULL,
    km_rodados INTEGER DEFAULT 0,
    consumo_km_l NUMERIC(6, 2) DEFAULT 0,
    custo_por_km NUMERIC(6, 2) DEFAULT 0,
    forma_pagamento TEXT DEFAULT 'Cartão de Crédito NuBank',
    comprovante_url TEXT,
    transacao_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_veiculo ON public.fuel_logs(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_data ON public.fuel_logs(data);

-- =====================================================================
-- 11. TABELA: goals (Metas Financeiras, Limites de Gastos e Economia)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id TEXT PRIMARY KEY,
    usuario_id TEXT REFERENCES public.users(id),
    titulo TEXT NOT NULL,
    tipo_meta TEXT NOT NULL CHECK (tipo_meta IN ('gasto', 'economia')),
    periodo TEXT NOT NULL CHECK (periodo IN ('mensal', 'anual', 'semanal')) DEFAULT 'mensal',
    valor_planejado NUMERIC(12, 2) NOT NULL,
    valor_atual NUMERIC(12, 2) DEFAULT 0,
    subcategoria_id TEXT REFERENCES public.subcategories(id),
    is_carro BOOLEAN DEFAULT false,
    alerta_percentual INTEGER DEFAULT 85,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- 12. TABELA: shopping_list (Lista de Compras Inteligente: Manual / Alexa / Siri)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.shopping_list (
    id TEXT PRIMARY KEY,
    usuario_id TEXT REFERENCES public.users(id),
    estabelecimento_tipo TEXT NOT NULL DEFAULT 'Supermercado',
    estabelecimento_nome TEXT,
    nome_do_item TEXT NOT NULL,
    quantidade TEXT DEFAULT '1 un',
    categoria_item TEXT DEFAULT 'Alimentos',
    comprado BOOLEAN DEFAULT false,
    origem TEXT NOT NULL CHECK (origem IN ('manual', 'alexa', 'siri')) DEFAULT 'manual',
    preco_estimado NUMERIC(10, 2) DEFAULT 0,
    data_adicao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================================
-- 13. TABELA: monthly_expectations (Expectativa Orçamentária das Planilhas)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.monthly_expectations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes_ano VARCHAR(7) NOT NULL, -- Ex: '2026-03'
    subcategoria_id TEXT NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
    valor_expectativa NUMERIC(12, 2) NOT NULL,
    UNIQUE(mes_ano, subcategoria_id)
);

CREATE INDEX IF NOT EXISTS idx_monthly_exp_mes ON public.monthly_expectations(mes_ano);

-- =====================================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- =====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_expectations ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para o sistema doméstico autenticado e anônimo da família Duarte
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Acesso total Casal Duarte" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Acesso total Casal Duarte" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
