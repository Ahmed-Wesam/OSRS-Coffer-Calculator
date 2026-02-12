export default async function handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any
): Promise<void> {
  response.status(200).json({ 
    message: 'API working',
    timestamp: new Date().toISOString(),
    test: true
  })
}
