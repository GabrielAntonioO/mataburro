export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt vacío' });
  }

  // Filtros de seguridad para menores
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía'];
  const promptLower = prompt.toLowerCase();
  
  for (const word of blockedWords) {
    if (promptLower.includes(word)) {
      return res.status(400).json({ 
        error: 'El prompt contiene contenido inapropiado. Por favor, solicita imágenes educativas.' 
      });
    }
  }

  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN no configurado');
    }

    console.log(`[IMAGE] Generando: ${prompt}`);

    // Usar Stable Diffusion 3 vía Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'a1c969823fbf3d46378b0cf1d5aac33f51ed7f6f1abe21b155c23b432f38cbf1',
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate error: ${JSON.stringify(error)}`);
    }

    const prediction = await response.json();
    console.log(`[IMAGE] Prediction ID: ${prediction.id}`);

    // Esperar a que se complete (máx 60 segundos)
    let completed = false;
    let attempts = 0;
    let imageUrl = null;

    while (!completed && attempts < 120) {
      await new Promise(r => setTimeout(r, 500));

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const statusData = await statusResponse.json();

      if (statusData.status === 'succeeded') {
        imageUrl = statusData.output?.[0];
        completed = true;
        console.log(`[IMAGE] ✅ Completada: ${imageUrl}`);
      } else if (statusData.status === 'failed') {
        throw new Error(`Generación fallida: ${statusData.error}`);
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error('Timeout al generar imagen');
    }

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt
    });

  } catch (e) {
    console.error('[IMAGE ERROR]', e.message);
    return res.status(500).json({
      error: 'Error al generar imagen',
      details: e.message
    });
  }
}
