import { AccessToken, TrackSource } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL
  ? process.env.LIVEKIT_URL.trim()
  : '';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
  ? process.env.LIVEKIT_API_KEY.trim()
  : '';

const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
  ? process.env.LIVEKIT_API_SECRET.replace(/\s+/g, '')
  : '';

/**
 * Vercel Serverless Function: POST /api/token
 * Generates a LiveKit token for USER or ADMIN roles.
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return res.status(500).json({
      error: 'Server misconfiguration: LiveKit environment variables missing.',
    });
  }

  try {
    const { role } = req.body;

    if (role !== 'USER' && role !== 'ADMIN') {
      return res.status(400).json({
        error: "Invalid role. Role must be 'USER' or 'ADMIN'.",
      });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const identity = `${role.toLowerCase()}-${randomSuffix}`;
    const name = `${role} (${randomSuffix})`;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name,
    });

    if (role === 'USER') {
      at.addGrant({
        room: 'voice-test',
        roomJoin: true,
        canPublish: true,
        canPublishSources: [TrackSource.MICROPHONE],
        canSubscribe: true,
      });
    } else {
      // ADMIN: listen-only
      at.addGrant({
        room: 'voice-test',
        roomJoin: true,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      });
    }

    const token = await at.toJwt();

    return res.status(200).json({
      token,
      url: LIVEKIT_URL,
      identity,
      role,
      room: 'voice-test',
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}
