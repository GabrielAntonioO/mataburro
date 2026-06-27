// api/test-connection.js
export default async function handler(req, res) {
  try {
    // Prueba 1: Conectar al dominio sin token
    const response = await fetch('https://api-inference.huggingface.co/status', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mataburro-Test'
      }
    });

    const status = response.status;
    const text = await response.text();

    return res.status(200).json({
      success: true,
      status,
      text: text.substring(0, 200) // truncar
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error de conexión: ' + error.message,
      stack: error.stack
    });
  }
}
