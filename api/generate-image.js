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
    // Usar Stable Diffusion 3.5 Large (modelo oficial, muy estable)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "8a9fbb4cbd6591f4e41c4d94125aa27c32b2260fdc7b0c03d1cc9e4f6cbea5a6",
        input: {
          prompt: prompt,
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "DPMSolverMultistep",
          num_inference_steps: 25,
          guidance_scale: 7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[REPLICATE ERROR]', errorText);
      throw new Error(`Replicate error: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();
    
    return res.status(200).json({
      id: prediction.id,
      status: prediction.status
    });

  } catch (error) {
    console.error('[GENERATE-IMAGE ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
