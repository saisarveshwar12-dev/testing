import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

export default function App() {
  const [role, setRole] = useState('USER'); // 'USER' | 'ADMIN'
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  const [audioPlaybackAllowed, setAudioPlaybackAllowed] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const roomRef = useRef(null);

  // Clean up room on component unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage('');

    try {
      // 1. Request token from backend
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to obtain LiveKit token');
      }

      const { token, url } = await response.json();

      // 2. Initialize LiveKit Room with high quality audio settings
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      roomRef.current = room;

      // 3. Audio track subscription handler - attaches remote audio to DOM
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.autoplay = true;
          audioElement.play().catch((err) => {
            console.warn('Autoplay prevented by browser:', err);
            setAudioPlaybackAllowed(false);
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      // Handle audio playback status changes for browser autoplay policies
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setAudioPlaybackAllowed(room.canPlaybackAudio);
      });

      // Track participant count changes
      const updateParticipantCount = () => {
        if (room) {
          // remoteParticipants + localParticipant
          setParticipantCount(room.remoteParticipants.size + 1);
        }
      };

      room.on(RoomEvent.ParticipantConnected, updateParticipantCount);
      room.on(RoomEvent.ParticipantDisconnected, updateParticipantCount);

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setIsConnecting(false);
        roomRef.current = null;
      });

      // 4. Connect to the LiveKit Room
      await room.connect(url, token);

      // Start room audio playback context immediately on user gesture
      await room.startAudio();

      // 5. If USER role, activate microphone by default
      if (role === 'USER') {
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setIsMicEnabled(true);
        } catch (micErr) {
          console.warn('Microphone permission denied or not found:', micErr);
          setIsMicEnabled(false);
        }
      }

      updateParticipantCount();
      setIsConnected(true);
    } catch (err) {
      console.error('Connection failed:', err);
      setErrorMessage(err.message || 'Failed to connect to voice room');
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setIsMicEnabled(false);
  };

  const handleToggleMic = async () => {
    if (!roomRef.current || role !== 'USER') return;

    try {
      const nextState = !isMicEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      setIsMicEnabled(nextState);
    } catch (err) {
      console.error('Error toggling microphone:', err);
      setErrorMessage('Could not toggle microphone: ' + err.message);
    }
  };

  const handleUnlockAudio = async () => {
    if (roomRef.current) {
      await roomRef.current.startAudio();
      setAudioPlaybackAllowed(true);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <h1>Voice Test</h1>
        <div className={`room-badge ${isConnected ? 'connected' : ''}`}>
          <span className="dot"></span>
          <span>Room: voice-test</span>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="error-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Role Selection (USER / ADMIN) */}
      <div>
        <div className="section-label">Select Role</div>
        <div className="role-grid">
          <button
            id="role-user-btn"
            type="button"
            className={`role-btn ${role === 'USER' ? 'active' : ''}`}
            onClick={() => setRole('USER')}
            disabled={isConnected || isConnecting}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>USER</span>
            <span className="role-subtitle">Speak & Listen</span>
          </button>

          <button
            id="role-admin-btn"
            type="button"
            className={`role-btn ${role === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setRole('ADMIN')}
            disabled={isConnected || isConnecting}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>ADMIN</span>
            <span className="role-subtitle">Listen-Only</span>
          </button>
        </div>
      </div>

      {/* Autoplay resume alert if needed */}
      {!audioPlaybackAllowed && isConnected && (
        <button className="btn-primary" onClick={handleUnlockAudio} style={{ background: 'var(--warning)' }}>
          Click to Enable Audio Playback
        </button>
      )}

      {/* Active Session Controls or Connect Button */}
      {isConnected ? (
        <div className="session-controls">
          <div className="audio-status">
            <span>Status</span>
            <span className="status-value">
              Connected ({participantCount} participant{participantCount > 1 ? 's' : ''})
            </span>
          </div>

          {/* USER: Microphone Button */}
          {role === 'USER' && (
            <button
              id="mic-toggle-btn"
              type="button"
              className={`mic-btn ${isMicEnabled ? 'mic-active' : 'mic-muted'}`}
              onClick={handleToggleMic}
            >
              {isMicEnabled ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span>Microphone Active (Click to Mute)</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span>Microphone Muted (Click to Unmute)</span>
                </>
              )}
            </button>
          )}

          {/* ADMIN: Listen-only status (NO mic button) */}
          {role === 'ADMIN' && (
            <div className="listen-only-badge" id="listen-only-status">
              <div className="badge-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </div>
              <div className="listen-title">Listen-Only Mode</div>
              <div className="listen-desc">
                You can hear all participants in real time. Publishing audio or microphone tracks is strictly disabled.
              </div>
            </div>
          )}

          {/* Disconnect Button */}
          <button id="disconnect-btn" type="button" className="btn-disconnect" onClick={handleDisconnect}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
            <span>Disconnect</span>
          </button>
        </div>
      ) : (
        /* Connect Button */
        <button
          id="connect-btn"
          type="button"
          className="btn-primary"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <span>Connecting to voice-test...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              <span>Connect as {role}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
