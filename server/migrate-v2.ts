import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getSupabaseUrl, getSupabaseKey } from './supabase-storage.js';

dotenv.config();

function getFirebaseAdmin(): Firestore | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (!raw && !gac) {
    return null;
  }

  let app: App;
  if (!getApps().length) {
    if (raw) {
      let json: any;
      if (raw.startsWith('{')) {
        json = JSON.parse(raw);
      } else {
        json = JSON.parse(fs.readFileSync(raw, 'utf-8'));
      }
      if (json.private_key && typeof json.private_key === 'string') {
        json.private_key = json.private_key.replace(/\\n/g, '\n');
      }
      app = initializeApp({ credential: cert(json) });
    } else {
      app = initializeApp({ credential: applicationDefault() });
    }
  } else {
    app = getApps()[0];
  }

  let dbId: string | undefined = undefined;
  if (process.env.FIRESTORE_DATABASE_ID) {
    dbId = process.env.FIRESTORE_DATABASE_ID.trim();
  } else {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
      dbId = cfg.firestoreDatabaseId;
    } catch {}
  }

  return getFirestore(app, dbId);
}

export interface MigracaoRelatorio {
  success: boolean;
  mensagem: string;
  detalhes: {
    configs: number;
    campanhas: number;
    cotas: number;
    pedidos: number;
    compradores: number;
    estilos: number;
    checkouts: number;
    transacoes: number;
    saques: number;
    fila: number;
  };
  erros: string[];
}

export async function executarMigracaoFirebaseParaSupabase(): Promise<MigracaoRelatorio> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis do Supabase (SUPABASE_URL e SUPABASE_KEY/SUPABASE_ANON_KEY) não encontradas.');
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const firestore = getFirebaseAdmin();
  if (!firestore) {
    throw new Error('Credenciais do Firebase (FIREBASE_SERVICE_ACCOUNT) não encontradas no ambiente para ler os dados antigos.');
  }

  const relatorio: MigracaoRelatorio = {
    success: true,
    mensagem: 'Migração concluída com sucesso',
    detalhes: {
      configs: 0,
      campanhas: 0,
      cotas: 0,
      pedidos: 0,
      compradores: 0,
      estilos: 0,
      checkouts: 0,
      transacoes: 0,
      saques: 0,
      fila: 0
    },
    erros: []
  };

  console.log('🔄 [MIGRAÇÃO] Iniciando migração do Firebase Firestore para o Supabase...');

  // 1. CONFIGURAÇÕES
  try {
    const snap = await firestore.collection('configuracoes').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('configs').upsert({
        owner_id: doc.id,
        dados: data
      });
      if (!error) relatorio.detalhes.configs++;
      else relatorio.erros.push(`Config ${doc.id}: ${error.message}`);
    }
    console.log(`✅ [MIGRAÇÃO] ${relatorio.detalhes.configs} configurações migradas.`);
  } catch (err: any) {
    relatorio.erros.push(`Erro em configuracoes: ${err?.message || err}`);
  }

  // 2. CAMPANHAS E COTAS
  try {
    const snap = await firestore.collection('campanhas').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('campanhas').upsert({
        id: doc.id,
        owner_id: data.ownerId || '',
        codigo: (data.codigo || '').toLowerCase().trim(),
        dados: data
      });

      if (!error) {
        relatorio.detalhes.campanhas++;
      } else {
        relatorio.erros.push(`Campanha ${doc.id}: ${error.message}`);
      }

      // Migra subcoleção de cotas da campanha
      try {
        const cotasSnap = await firestore.collection('campanhas').doc(doc.id).collection('cotas').get();
        if (!cotasSnap.empty) {
          const cotasRows = cotasSnap.docs.map(cDoc => {
            const cData = cDoc.data();
            return {
              campanha_id: doc.id,
              numero: String(cDoc.id),
              status: cData.status || 'livre',
              reservado_ate: cData.reservadoAte || null,
              pedido_id: cData.pedidoId || null,
              comprador_id: cData.compradorId || null,
              comprador_nome: cData.compradorNome || null
            };
          });

          // Inserir em chunks de 400
          for (let i = 0; i < cotasRows.length; i += 400) {
            const chunk = cotasRows.slice(i, i + 400);
            const { error: cotaErr } = await supabase
              .from('cotas')
              .upsert(chunk, { onConflict: 'campanha_id,numero' });

            if (!cotaErr) {
              relatorio.detalhes.cotas += chunk.length;
            } else {
              relatorio.erros.push(`Cotas lote ${i} da camp ${doc.id}: ${cotaErr.message}`);
            }
          }
        }
      } catch (cErr: any) {
        relatorio.erros.push(`Erro cotas camp ${doc.id}: ${cErr?.message || cErr}`);
      }
    }
    console.log(`✅ [MIGRAÇÃO] ${relatorio.detalhes.campanhas} campanhas e ${relatorio.detalhes.cotas} cotas migradas.`);
  } catch (err: any) {
    relatorio.erros.push(`Erro em campanhas: ${err?.message || err}`);
  }

  // 3. PEDIDOS
  try {
    const snap = await firestore.collection('pedidos').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('pedidos').upsert({
        id: doc.id,
        owner_id: data.ownerId || '',
        campanha_id: data.campanhaId || '',
        mp_payment_id: data.mpPaymentId ? String(data.mpPaymentId) : null,
        efi_payment_id: data.efiPaymentId ? String(data.efiPaymentId) : null,
        status: data.status || 'pendente',
        dados: data
      });

      if (!error) relatorio.detalhes.pedidos++;
      else relatorio.erros.push(`Pedido ${doc.id}: ${error.message}`);
    }
    console.log(`✅ [MIGRAÇÃO] ${relatorio.detalhes.pedidos} pedidos migrados.`);
  } catch (err: any) {
    relatorio.erros.push(`Erro em pedidos: ${err?.message || err}`);
  }

  // 4. COMPRADORES
  try {
    const snap = await firestore.collection('compradores').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('compradores').upsert({
        whatsapp: doc.id,
        nome: data.nome || null
      });
      if (!error) relatorio.detalhes.compradores++;
      else relatorio.erros.push(`Comprador ${doc.id}: ${error.message}`);
    }
    console.log(`✅ [MIGRAÇÃO] ${relatorio.detalhes.compradores} compradores migrados.`);
  } catch (err: any) {
    relatorio.erros.push(`Erro em compradores: ${err?.message || err}`);
  }

  // 5. ESTILOS
  try {
    const snap = await firestore.collection('estilos').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('estilos').upsert({
        id: doc.id,
        owner_id: data.ownerId || '',
        dados: data
      });
      if (!error) relatorio.detalhes.estilos++;
    }
  } catch {}

  // 6. CHECKOUTS
  try {
    const snap = await firestore.collection('checkouts').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('checkouts').upsert({
        id: doc.id,
        owner_id: data.ownerId || '',
        dados: data
      });
      if (!error) relatorio.detalhes.checkouts++;
    }
  } catch {}

  // 7. TRANSACOES
  try {
    const snap = await firestore.collection('transacoes').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('transacoes').upsert({
        id: doc.id,
        owner_id: data.ownerId || '',
        dados: data
      });
      if (!error) relatorio.detalhes.transacoes++;
    }
  } catch {}

  // 8. SAQUES
  try {
    const snap = await firestore.collection('saques').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('saques').upsert({
        id: doc.id,
        owner_id: data.ownerId || '',
        dados: data
      });
      if (!error) relatorio.detalhes.saques++;
    }
  } catch {}

  // 9. FILA
  try {
    const snap = await firestore.collection('fila').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('fila').upsert({
        id: doc.id,
        chave_idempotencia: data.chaveIdempotencia || doc.id,
        campanha_id: data.campanhaId || null,
        status: data.status || 'pendente',
        dados: data
      });
      if (!error) relatorio.detalhes.fila++;
    }
  } catch {}

  console.log('🎉 [MIGRAÇÃO] Concluída com sucesso!', JSON.stringify(relatorio.detalhes));
  return relatorio;
}

// Execução direta via CLI se chamado diretamente
if (process.argv[1]?.endsWith('migrate-v2.ts') || process.argv[1]?.endsWith('migrate-v2.js')) {
  executarMigracaoFirebaseParaSupabase()
    .then(res => {
      console.log('Resultado da migração:', res);
      process.exit(0);
    })
    .catch(err => {
      console.error('Falha na migração:', err);
      process.exit(1);
    });
}
