// api/generate-image.js
export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'Prompt inválido' });
  }

  // Filtro básico de seguridad
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía'];
  if (blockedWords.some(word => prompt.toLowerCase().includes(word))) {
    return res.status(400).json({ error: 'Contenido inapropiado.' });
  }

  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    console.error('Falta HUGGINGFACE_API_TOKEN en entorno');
    return res.status(500).json({ error: 'Token de Hugging Face no configurado' });
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: 'blurry, low quality, distorted',
            width: 768,
            height: 768,
            num_inference_steps: 25,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Hugging Face:', response.status, errorText);
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Límite de generaciones alcanzado. Espera unos minutos.'
        });
      }
      
      throw new Error(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
    }

    // La imagen viene como binario
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return res.status(200).json({
      success: true,
      image: imageUrl
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Error generando imagen: ' + error.message
    });
  }
}
