// api/generate-image.js
export default async function handler(req, res) {
  // 1. Validaciones de método y prompt
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt inválido' });

  // 2. Filtro de seguridad básico (mejor tenerlo)
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía'];
  if (blockedWords.some(word => prompt.toLowerCase().includes(word))) {
    return res.status(400).json({ error: 'Contenido inapropiado.' });
  }

  // 3. Llamada a la API de Replicate
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' });

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1", // ID de SDXL
        input: {
          prompt: prompt,
          negative_prompt: "blurry, low quality, distorted",
          width: 768,
          height: 768,
          num_outputs: 1,
        }
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Error con Replicate: ${errorText}` });
    }

    const prediction = await response.json();
    // 4. Devolver solo el ID de la predicción al frontend
    return res.status(200).json({ id: prediction.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno al iniciar la generación.' });
  }
}