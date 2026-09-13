import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

const tables = [
  'users',
  'categories',
  'subcategories',
  'establishments',
  'vehicles',
  'transactions',
  'purchase_items',
  'receipts',
  'fuel_logs',
  'goals',
  'shopping_list',
  'monthly_expectations'
];

async function checkAll() {
  console.log('--- 📊 Diagnóstico de Tabelas no Supabase ---');
  for (const t of tables) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ [${t}]: Erro (${error.message})`);
      } else {
        console.log(`✅ [${t}]: OK (${count} registros)`);
      }
    } catch (e) {
      console.log(`❌ [${t}]: Exceção (${e.message})`);
    }
  }
}

checkAll();
