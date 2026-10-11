-- =====================================================================
-- Elimina dados hardcoded do GoalsDesktopView.tsx (localStorage-only):
-- categorias de orçamento ("duarte_desktop_categories") e custos
-- planejados do carro ("duarte_car_costs") passam a viver no Supabase,
-- sincronizando entre todos os dispositivos do casal.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    limite NUMERIC(12, 2) NOT NULL DEFAULT 0,
    icone TEXT DEFAULT 'cart',
    nota TEXT DEFAULT '',
    alerta_percentual INTEGER DEFAULT 85,
    tipo TEXT NOT NULL CHECK (tipo IN ('expense', 'saving')) DEFAULT 'expense',
    ordem INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.budget_categories (id, nome, limite, icone, alerta_percentual, tipo, ordem) VALUES
    ('supermercado', 'Supermercado & Feira', 2500, 'cart', 85, 'expense', 1),
    ('lazer', 'Lazer & Gastronomia', 1200, 'utensils', 85, 'expense', 2),
    ('combustivel', 'Combustível Mensal', 800, 'fuel', 85, 'expense', 3),
    ('farmacia', 'Farmácia & Cuidados', 450, 'pill', 85, 'expense', 4)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total Casal Duarte" ON public.budget_categories;
CREATE POLICY "Acesso total Casal Duarte" ON public.budget_categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.car_planning_items (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL DEFAULT 0,
    badge TEXT DEFAULT '',
    subtext TEXT DEFAULT '',
    gasto NUMERIC(12, 2) DEFAULT 0,
    data DATE,
    tipo TEXT NOT NULL CHECK (tipo IN ('quota', 'annual', 'ceiling', 'monthly')) DEFAULT 'annual',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.car_planning_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total Casal Duarte" ON public.car_planning_items;
CREATE POLICY "Acesso total Casal Duarte" ON public.car_planning_items FOR ALL USING (true) WITH CHECK (true);

-- Garante que o veículo real do casal exista (hoje hardcoded como 'veh-compass' no código)
INSERT INTO public.vehicles (id, modelo, placa, odometro_atual, observacoes)
VALUES ('veh-compass', 'Jeep Compass', 'CASAL-DUARTE', 124524, 'Marco zero do odômetro em 16/09/2026 (Posto Martines)')
ON CONFLICT (id) DO NOTHING;

-- Estabelecimento conhecido usado hoje via KNOWN_CNPJS hardcoded em receiptNormalizer.ts
INSERT INTO public.establishments (id, nome, tipo, cidade)
VALUES ('est-posto-martines', 'Posto Martines', 'Posto de combustível', 'Floriano/PI')
ON CONFLICT (id) DO NOTHING;

-- Coluna de CNPJ para permitir lookup de estabelecimentos conhecidos por CNPJ (substitui KNOWN_CNPJS)
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS cnpj TEXT;
CREATE INDEX IF NOT EXISTS idx_establishments_cnpj ON public.establishments(cnpj) WHERE cnpj IS NOT NULL;

UPDATE public.establishments SET cnpj = '12070974000120' WHERE id = 'est-posto-martines' AND cnpj IS NULL;
