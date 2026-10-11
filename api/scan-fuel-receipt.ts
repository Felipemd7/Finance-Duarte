import { analyzeFuelReceiptImage } from '../server/receiptAnalyzer.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });
    }

    const data = await analyzeFuelReceiptImage(imageBase64, mimeType);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('[api/scan-fuel-receipt]:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: 'Não foi possível ler com nitidez os dados do abastecimento. Você pode preencher manualmente os valores.',
      details: err?.message,
    });
  }
}
