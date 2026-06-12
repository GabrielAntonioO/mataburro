// api/check-image.js
export default async function handler(req, res) {
  const { id } = req.query; // El id viene como parámetro en la URL: /api/check-image?id=...

  if (!id) {
    return res.status(400).json({ error: 'ID de predicción no proporcionado.' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' });

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Token ${token}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Error al consultar Replicate: ${errorText}` });
    }

    const prediction = await response.json();
    // Devolver el estado y la URL de la imagen si ya está lista
    return res.status(200).json({ 
        status: prediction.status, 
        output: prediction.output 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al consultar el estado de la imagen.' });
  }
}