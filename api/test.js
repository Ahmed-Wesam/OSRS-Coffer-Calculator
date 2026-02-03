export default async function handler(request, response) {
  return response.status(200).json({ message: 'API works', timestamp: new Date().toISOString() })
}
