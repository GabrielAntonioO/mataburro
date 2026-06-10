export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Se requiere ID de predicción' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Token ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Replicate error: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      status: data.status, // "starting", "processing", "succeeded", "failed"
      output: data.output, // array de URLs cuando succeeded
      error: data.error
    });

  } catch (error) {
    console.error('[CHECK-IMAGE ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
