export default async function handler(
  request: any, 
  response: any
): Promise<void> {
  response.status(200).json({ 
    message: 'API working',
    timestamp: new Date().toISOString(),
    test: true
  })
}
