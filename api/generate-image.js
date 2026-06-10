export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;
  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt vacío' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' });
  }

  try {
    // Modelo SDXL que SÍ funciona (lo uso en producción)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1",
        input: {
          prompt: prompt,
          negative_prompt: "blurry, bad, ugly, porn, sexual, violent",
          width: 768,
          height: 768,
          num_outputs: 1,
          num_inference_steps: 25,
          guidance_scale: 7.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate error:', errorText);
      return res.status(response.status).json({ 
        error: `Replicate error: ${response.status}`,
        details: errorText
      });
    }

    const prediction = await response.json();
    
    // Devolver el ID para polling
    return res.status(200).json({
      id: prediction.id,
      status: prediction.status
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
