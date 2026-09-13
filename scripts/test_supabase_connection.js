import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('--- 🧪 Teste de Conexão Supabase ---');
console.log('URL configurada:', url ? url.substring(0, 30) + '...' : '(NÃO DEFINIDA)');
console.log('Chave configurada:', key ? key.substring(0, 15) + '...' : '(NÃO DEFINIDA)');

if (!url || !key) {
  console.log('\n❌ Supabase ainda não está configurado no arquivo .env!');
  console.log('Por favor, preencha as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  try {
    console.log('\nTentando consultar tabela "users"...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.users" does not exist') || error.message.includes('does not exist')) {
        console.log('⚠️ Conexão com o Supabase BEM SUCEDIDA!');
        console.log('Contudo, as tabelas ainda não foram criadas no banco de dados.');
        console.log('Execute o arquivo "supabase/schema.sql" no SQL Editor do seu projeto Supabase para criar as tabelas.');
        process.exit(0);
      }
      console.log('❌ Erro retornado pelo Supabase:', error.message);
      process.exit(1);
    }

    console.log('✅ CONEXÃO BEM SUCEDIDA!');
    console.log('Tabela "users" encontrada e acessível no Supabase.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Falha inesperada ao conectar:', err.message);
    process.exit(1);
  }
}

testConnection();
