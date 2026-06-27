// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'Prompt inválido' });
  }

  // Filtro de seguridad
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía'];
  if (blockedWords.some(word => prompt.toLowerCase().includes(word))) {
    return res.status(400).json({ error: 'Contenido inapropiado.' });
  }

  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    console.error('❌ Falta HUGGINGFACE_API_TOKEN');
    return res.status(500).json({ error: 'Token de Hugging Face no configurado' });
  }

  // Usamos un modelo más estable y rápido
  const MODEL_URL = 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5';

  try {
    console.log('📤 Enviando prompt a Hugging Face:', prompt);

    const response = await fetch(MODEL_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: 'blurry, low quality, distorted',
          width: 512,   // Más pequeño = más rápido
          height: 512,
          num_inference_steps: 20,
        },
      }),
      // Timeout de 15 segundos (Vercel permite hasta 10s, pero podemos intentar)
      signal: AbortSignal.timeout(15000),
    });

    console.log('📥 Respuesta de Hugging Face:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Hugging Face:', response.status, errorText);
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Límite de generaciones alcanzado. Espera unos minutos.'
        });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({
          error: 'Token inválido o sin permisos. Verifica tu API key.'
        });
      }
      
      throw new Error(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
    }

    // La imagen viene como binario
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log('✅ Imagen generada correctamente');

    return res.status(200).json({
      success: true,
      image: imageUrl
    });

  } catch (error) {
    console.error('❌ Error en generate-image:', error.message);
    
    // Si es timeout, mensaje amigable
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'La generación tardó demasiado. Intenta con un prompt más corto.'
      });
    }

    return res.status(500).json({
      error: 'Error generando imagen: ' + error.message
    });
  }
}
