export default async function handler(request, response) {
  return response.status(200).json({ 
    message: 'API working',
    timestamp: new Date().toISOString(),
    test: true
  })
}
