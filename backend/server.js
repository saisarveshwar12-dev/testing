import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken, TrackSource } from 'livekit-server-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const LIVEKIT_URL = process.env.LIVEKIT_URL ? process.env.LIVEKIT_URL.trim() : '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ? process.env.LIVEKIT_API_KEY.trim() : '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ? process.env.LIVEKIT_API_SECRET.replace(/\s+/g, '') : '';

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  console.warn('WARNING: LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET is missing in .env');
}

/**
 * Generate token endpoint
 * Role must be either 'USER' or 'ADMIN'
 */
app.post('/api/token', async (req, res) => {
  try {
    const { role } = req.body;

    if (role !== 'USER' && role !== 'ADMIN') {
      return res.status(400).json({ error: "Invalid role. Role must be 'USER' or 'ADMIN'." });
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
      at.addGrant({
        room: 'voice-test',
        roomJoin: true,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      });
    }

    const token = await at.toJwt();

    return res.json({
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
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
