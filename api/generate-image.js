export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt vacío' });
  }

  // Seguridad para menores
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía'];
  const promptLower = prompt.toLowerCase();
  for (const word of blockedWords) {
    if (promptLower.includes(word)) {
      return res.status(400).json({ error: 'Contenido inapropiado. Solicita imágenes educativas.' });
    }
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' });
  }

  try {
    // Usar flux-schnell (mucho más rápido y confiable)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "da77bc2ee1e15ea2c5eabf5b6db8ec6b1c3b1d2f8e6c3a5c4e7a9c8b4f2a1e3d",
        input: {
          prompt: prompt,
          go_fast: true,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate error: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();
    
    // ✅ Devuelve inmediatamente el ID de la predicción
    return res.status(200).json({
      id: prediction.id,
      status: prediction.status
    });

  } catch (error) {
    console.error('[GENERATE-IMAGE ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
