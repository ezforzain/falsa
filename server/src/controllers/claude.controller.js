// Simple proxy/controller to forward requests to a configured Claude API endpoint.
// It forwards the incoming JSON body to the URL in `process.env.CLAUDE_API_URL`
// and returns the provider response directly.
export async function handleClaude(req, res, next) {
  try {
    const url = process.env.CLAUDE_API_URL;
    const key = process.env.CLAUDE_API_KEY;
    if (!url || !key) {
      return res.status(500).json({ message: 'Claude API not configured on server.' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(req.body),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.ok ? 200 : response.status).json(data);
    }

    const text = await response.text();
    return res.status(response.ok ? 200 : response.status).send(text);
  } catch (err) {
    next(err);
  }
}
