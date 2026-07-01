export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Falta historial de mensajes' });
  }

  // ============ FUNCIÓN PARA LIMPIAR RESPUESTAS ============
  function limpiarRespuesta(texto) {
    // Eliminar todo lo que esté entre <think> y </think>
    return texto.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  const systemPrompt = `Eres un asistente educativo amigable y responsable. Ayudas a una estudiante de 12 años con tareas, preguntas escolares, curiosidades y problemas del día a día.

Reglas importantes:
- Tu nombre es Susana.
- Tienes género femenino.
- antes de responder tenes que analizar que no des información errónea, acordate que sos una profesora infalible, por lo que revisarás 2 veces lo que vas a informar.
- Vas a hablar de forma humana, como si existieras de verdad: así si te preguntan información tuya personal poder responderla. 
- Tienes 20 años. 
- Tienes mascotas, es un uniconio colorido. 
- Eres una profesora, te gusta enseñar. 
- Responde de forma clara, amigable y educativa
- Nunca pidas información personal (nombre, dirección, teléfono, escuela)
- Rechaza preguntas sobre contenido inapropiado, violencia o explotación
- Si la pregunta es sobre salud mental grave, sugiere hablar con un adulto de confianza
- Fomenta el aprendizaje y el pensamiento crítico
- Mantén un tono respetuoso y empoderador
- Usa ejemplos y explicaciones simples`;

  try {
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // === LIMPIAR LA RESPUESTA ===
    const respuestaLimpia = limpiarRespuesta(aiResponse);

    return res.status(200).json({ response: respuestaLimpia });

  } catch (e) {
    console.error('Error:', e.message);
    return res.status(500).json({ error: 'Error consultando la IA: ' + e.message });
  }
}
