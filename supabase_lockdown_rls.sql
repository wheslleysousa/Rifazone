-- =====================================================================
-- RifaZone — TRAVAR O BANCO (RLS lockdown)
-- =====================================================================
-- O QUE ISTO FAZ:
--   Hoje suas tabelas têm políticas "USING (true)" — ou seja, qualquer pessoa
--   com a sua chave ANON do Supabase (que é semi-pública) pode LER, ALTERAR e
--   APAGAR tudo direto no banco: CPF/e-mail/telefone dos compradores, pedidos,
--   saldos e saques — passando por cima do seu servidor.
--
--   Este script remove essas políticas abertas. Com o RLS ligado e SEM política,
--   os papéis públicos (anon / authenticated) ficam BLOQUEADOS. Apenas o seu
--   servidor, que usa a SERVICE_ROLE_KEY (que ignora o RLS), continua acessando.
--
-- ⚠️ ORDEM OBRIGATÓRIA (senão o app para):
--   1) No Render → Environment, confirme que existe a variável
--        SUPABASE_SERVICE_ROLE_KEY  = (Supabase → Project Settings → API → service_role, "secret")
--      Essa chave é SECRETA — nunca a coloque no frontend nem com prefixo VITE_.
--   2) Salve e deixe o Render redeployar.
--   3) SÓ ENTÃO rode este script no Supabase → SQL Editor → New query → Run.
--
-- Como conferir se deu certo: a query final abaixo deve retornar 0 linhas.
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Garante RLS ligado em todas as tabelas sensíveis
    PERFORM 1;
    EXECUTE 'ALTER TABLE public.configs      ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.campanhas    ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.pedidos      ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.cotas        ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.compradores  ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.estilos      ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.checkouts    ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.transacoes   ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.saques       ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.fila         ENABLE ROW LEVEL SECURITY';

    -- Remove TODAS as políticas dessas tabelas (as abertas "USING(true)")
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('configs','campanhas','pedidos','cotas','compradores','estilos','checkouts','transacoes','saques','fila')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- VERIFICAÇÃO: deve retornar 0 linhas (nenhuma política aberta restante).
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('configs','campanhas','pedidos','cotas','compradores','estilos','checkouts','transacoes','saques','fila');
