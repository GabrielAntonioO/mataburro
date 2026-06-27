// api/test-token.js
export default async function handler(req, res) {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  
  if (!token) {
    return res.status(500).json({ error: 'Token no configurado en Vercel' });
  }

  // Mostramos solo los primeros 4 caracteres para verificar que existe
  console.log('Token empieza con:', token.substring(0, 4));

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Me encanta programar',
        parameters: { candidate_labels: ['programación', 'deporte', 'cocina'] }
      })
    });

    const data = await response.json();
    
    return res.status(200).json({
      status: response.status,
      ok: response.ok,
      data: data
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error al conectar con Hugging Face: ' + error.message
    });
  }
}
