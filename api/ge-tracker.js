export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  try {
    const targetUrl = 'https://www.ge-tracker.com/deaths-coffer'
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: 'text/html',
        // Some sites behave differently without a UA.
        'User-Agent': 'Mozilla/5.0 (compatible; OSRS-Coffer-Calculator/1.0)',
      },
    })

    const html = await upstream.text()

    res.statusCode = upstream.status
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html)
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
  }
}
