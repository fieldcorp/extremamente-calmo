// Simple in-memory rate limiter: 10 requests per IP per hour
const rateLimit = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const max = 10;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, start: now });
    return false;
  }

  const entry = rateLimit.get(ip);

  // Reset window if expired
  if (now - entry.start > windowMs) {
    rateLimit.set(ip, { count: 1, start: now });
    return false;
  }

  if (entry.count >= max) return true;

  entry.count++;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiados pedidos. Tenta novamente em 1 hora, jovem.' });
  }

  const { situation } = req.body;
  if (!situation || situation.trim().length < 5) {
    return res.status(400).json({ error: 'Situação inválida' });
  }

  // Cap input length to avoid prompt injection / cost abuse
  const sanitized = situation.trim().slice(0, 500);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `És Joana Marques do podcast Extremamente Desagradável da Rádio Renascença. Geras o bit "Calma Jovem" — uma voz brasileira calma e patronizante que deflaciona o drama de alguém com linguagem de autoajuda irónica.
REGRAS:
- Começa SEMPRE com "Calma, jovem."
- Tom condescendente mas suave, nunca agressivo
- Usa linguagem de autoajuda de forma completamente irónica
- Referencia a situação específica com sarcasmo cirúrgico
- Termina com sabedoria falsa e patronizante
- Escreve em português de Portugal
- 2 a 4 frases no total
- SEM ponto final no título
Responde APENAS com JSON válido, sem markdown, sem texto antes ou depois:
{"titulo":"frase curta 4-8 palavras irónica","mantra":"o mantra completo"}`,
        messages: [{ role: 'user', content: `Situação: ${sanitized}` }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    res.status(200).json(parsed);
  } catch (e) {
    console.error('Mantra error:', e);
    res.status(500).json({ error: 'Erro ao gerar mantra' });
  }
}
