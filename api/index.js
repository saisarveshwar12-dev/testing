/**
 * Vercel Serverless Function: GET /api
 * Health check endpoint
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'ok', message: 'Voice Test API is running!' });
}
