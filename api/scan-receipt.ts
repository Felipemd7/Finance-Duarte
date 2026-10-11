import { analyzeReceiptImage } from '../server/receiptAnalyzer.js';

export default async function handler(req: any, res: any) {
  // CORS support
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

    const result = await analyzeReceiptImage(imageBase64, mimeType);
    const total = result.valorTotal || 0;

    return res.json({
      success: true,
      data: {
        ...result,
        itens: (result.itens || []).map((it, idx) => ({ id: `item-${Date.now()}-${idx}`, ...it })),
        divisaoCasal: {
          porcentagemFelipe: 50,
          porcentagemGenivania: 50,
          valorFelipe: Number((total / 2).toFixed(2)),
          valorGenivania: Number((total / 2).toFixed(2)),
        },
      },
    });
  } catch (err: any) {
    console.error('[api/scan-receipt]:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: 'Não foi possível processar o comprovante. Verifique a qualidade da imagem e tente novamente.',
      details: err?.message,
    });
  }
}
