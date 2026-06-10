export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt vacío' });
  }

  // Filtro de seguridad
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía'];
  const promptLower = prompt.toLowerCase();
  for (const word of blockedWords) {
    if (promptLower.includes(word)) {
      return res.status(400).json({ error: 'Contenido inapropiado. Solicita imágenes educativas.' });
    }
  }

  // Pollinations genera la imagen al instante
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

  // Devolvemos el mismo formato que espera el frontend
  return res.status(200).json({
    id: Date.now().toString(),
    status: 'succeeded',
    output: [imageUrl]
  });
}