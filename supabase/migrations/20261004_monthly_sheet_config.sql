-- Configurações mensais da planilha de fechamento (expectativas, situações, vencimentos)
-- Substitui o uso de localStorage (duarte_expectativas_*, duarte_situacoes_*, duarte_vencimentos_*)
CREATE TABLE IF NOT EXISTS public.monthly_sheet_config (
    mes_ano VARCHAR(7) PRIMARY KEY, -- Ex: '2026-10'
    expectativas JSONB NOT NULL DEFAULT '{}'::jsonb,
    situacoes JSONB NOT NULL DEFAULT '{}'::jsonb,
    vencimentos JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_sheet_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total Casal Duarte" ON public.monthly_sheet_config;
CREATE POLICY "Acesso total Casal Duarte" ON public.monthly_sheet_config FOR ALL USING (true) WITH CHECK (true);
