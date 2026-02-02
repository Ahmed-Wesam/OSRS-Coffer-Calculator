const https = require('https')

// Handler for Netlify Functions
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  try {
    const targetUrl = 'https://www.ge-tracker.com/deaths-coffer'
    
    const response = await new Promise((resolve, reject) => {
      const req = https.get(targetUrl, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: {
              ...headers,
              'Content-Type': 'text/html'
            },
            body: data
          })
        })
      })
      
      req.on('error', reject)
      req.end()
    })

    return response
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch data' })
    }
  }
}
