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
  const blockedWords = ['violencia', 'arma', 'sangre', 'muerte', 'droga', 'sexual', 'adulto', 'pornografía', 'desnudo'];
  const promptLower = prompt.toLowerCase();
  
  for (const word of blockedWords) {
    if (promptLower.includes(word)) {
      return res.status(400).json({ 
        error: 'El prompt contiene contenido inapropiado. Solicita imágenes educativas.' 
      });
    }
  }

  try {
    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) {
      throw new Error('HUGGINGFACE_API_TOKEN no configurado');
    }

    console.log(`[IMAGE] Prompt: ${prompt}`);

    // Usar Stable Diffusion 2.1 vía Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        headers: { Authorization: `Bearer ${token}` },
        method: 'POST',
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    console.log(`[IMAGE] HF Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('[IMAGE] HF Error:', error);
      throw new Error(error.error || `HF Error ${response.status}`);
    }

    // La respuesta es un blob (imagen)
    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Imagen vacía recibida');
    }

    // Convertir blob a base64
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    console.log(`[IMAGE] ✅ Generada exitosamente`);

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt
    });

  } catch (e) {
    console.error('[IMAGE ERROR]', e.message);
    return res.status(500).json({
      error: e.message
    });
  }
}
