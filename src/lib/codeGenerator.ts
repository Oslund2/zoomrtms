interface Credentials {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  supabaseUrl: string;
  dataEndpoint: string;
}

export function generateNodeJSRTMSClient(credentials: Credentials): string {
  return `// Zoom RTMS Multi-Room Client - Production Ready
// Handles 1 main conference room + 8 breakout rooms simultaneously
// Based on official Zoom RTMS samples with enhanced error handling
//
// AUTHENTICATION: This client uses OAuth app credentials (Client ID + Client Secret)
// Meeting hosts authorize your OAuth app, allowing access to RTMS streams from their meetings

const rtms = require('@zoom/rtms').default;
const fetch = require('node-fetch');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION & VALIDATION
// ============================================================================

const REQUIRED_ENV_VARS = ['ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'];
const ZOOM_CLIENT_ID = '${credentials.clientId || process.env.ZOOM_CLIENT_ID || 'YOUR_CLIENT_ID'}';
const ZOOM_CLIENT_SECRET = '${credentials.clientSecret || process.env.ZOOM_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'}';
const DATA_ENDPOINT = '${credentials.dataEndpoint}';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

// Connection management
const activeConnections = new Map();
const connectionMetrics = new Map();
const reconnectTimers = new Map();

// Validate environment on startup
function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(key =>
    !process.env[key] && (key === 'ZOOM_CLIENT_ID' ? !ZOOM_CLIENT_ID.includes('YOUR_') : !ZOOM_CLIENT_SECRET.includes('YOUR_'))
  );

  if (missing.length > 0) {
    console.error(\`❌ Missing required environment variables: \${missing.join(', ')}\`);
    console.error('Please configure these in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

// ============================================================================
// AUTHENTICATION & SECURITY
// ============================================================================

function generateSignature(meetingUuid, streamId) {
  const message = \`\${ZOOM_CLIENT_ID},\${meetingUuid},\${streamId}\`;
  return crypto
    .createHmac('sha256', ZOOM_CLIENT_SECRET)
    .update(message)
    .digest('hex');
}

// ============================================================================
// DATA INGESTION WITH RETRY LOGIC
// ============================================================================

async function sendWithRetry(endpoint, data, retryCount = 0) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }

    return await response.json();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
        MAX_RETRY_DELAY
      );

      console.warn(\`Retry \${retryCount + 1}/\${MAX_RETRIES} after \${delay}ms: \${error.message}\`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return sendWithRetry(endpoint, data, retryCount + 1);
    }

    throw error;
  }
}

async function sendTranscript(meetingUuid, transcriptData) {
  try {
    await sendWithRetry(\`\${DATA_ENDPOINT}/transcript\`, {
      type: 'transcript',
      meeting_uuid: meetingUuid,
      ...transcriptData
    });
  } catch (error) {
    console.error(\`[ERROR] Failed to send transcript after \${MAX_RETRIES} retries:\`, error.message);
  }
}

async function sendParticipantUpdate(meetingUuid, participantData) {
  try {
    await sendWithRetry(\`\${DATA_ENDPOINT}/participant\`, {
      type: 'participant',
      meeting_uuid: meetingUuid,
      ...participantData
    });
  } catch (error) {
    console.error(\`[ERROR] Failed to send participant update:\`, error.message);
  }
}

async function sendMediaEvent(meetingUuid, eventData) {
  try {
    await sendWithRetry(\`\${DATA_ENDPOINT}/media-event\`, {
      type: 'media_event',
      meeting_uuid: meetingUuid,
      ...eventData
    });
  } catch (error) {
    console.error(\`[ERROR] Failed to send media event:\`, error.message);
  }
}

// ============================================================================
// CONNECTION METRICS & MONITORING
// ============================================================================

function initializeMetrics(meetingUuid, roomLabel) {
  connectionMetrics.set(meetingUuid, {
    roomLabel,
    connectedAt: new Date(),
    transcriptCount: 0,
    audioChunkCount: 0,
    participantUpdates: 0,
    reconnectAttempts: 0,
    lastActivity: new Date(),
    bytesProcessed: 0
  });
}

function updateMetrics(meetingUuid, updates) {
  const metrics = connectionMetrics.get(meetingUuid);
  if (metrics) {
    Object.assign(metrics, updates, { lastActivity: new Date() });
  }
}

function logMetrics(meetingUuid) {
  const metrics = connectionMetrics.get(meetingUuid);
  if (metrics) {
    const uptime = Math.floor((Date.now() - metrics.connectedAt.getTime()) / 1000);
    console.log(\`[\${metrics.roomLabel}] 📊 Metrics: \${uptime}s uptime, \${metrics.transcriptCount} transcripts, \${metrics.audioChunkCount} audio chunks, \${(metrics.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed\`);
  }
}

// ============================================================================
// ERROR HANDLING & RECONNECTION
// ============================================================================

function scheduleReconnect(meetingUuid, streamId, serverUrls, roomType, roomNumber, attemptCount = 0) {
  if (attemptCount >= MAX_RETRIES) {
    console.error(\`[\${roomType === 'main' ? 'Main Conference Room' : \`Breakout Room \${roomNumber}\`}] ❌ Max reconnection attempts reached\`);
    return;
  }

  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, attemptCount),
    MAX_RETRY_DELAY
  );

  console.log(\`Scheduling reconnection attempt \${attemptCount + 1}/\${MAX_RETRIES} in \${delay}ms\`);

  const timer = setTimeout(() => {
    console.log(\`Attempting reconnection \${attemptCount + 1}/\${MAX_RETRIES}\`);
    connectToMeeting(meetingUuid, streamId, serverUrls, roomType, roomNumber, attemptCount + 1);
  }, delay);

  reconnectTimers.set(meetingUuid, timer);
}

function cancelReconnect(meetingUuid) {
  const timer = reconnectTimers.get(meetingUuid);
  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(meetingUuid);
  }
}

// ============================================================================
// RTMS CLIENT CONNECTION
// ============================================================================

function connectToMeeting(meetingUuid, streamId, serverUrls, roomType, roomNumber, reconnectAttempt = 0) {
  const roomLabel = roomType === 'main'
    ? 'Main Conference Room'
    : \`Breakout Room \${roomNumber}\`;

  console.log(\`[\${roomLabel}] 🔌 Connecting to meeting... (attempt \${reconnectAttempt + 1})\`);
  console.log(\`[\${roomLabel}] Meeting UUID: \${meetingUuid}\`);
  console.log(\`[\${roomLabel}] Stream ID: \${streamId}\`);

  const client = new rtms.Client();
  initializeMetrics(meetingUuid, roomLabel);

  // ========== CONNECTION LIFECYCLE ==========

  client.onJoinConfirm((reason) => {
    console.log(\`[\${roomLabel}] ✅ Connected successfully\`);
    cancelReconnect(meetingUuid);

    const metrics = connectionMetrics.get(meetingUuid);
    if (metrics && reconnectAttempt > 0) {
      metrics.reconnectAttempts = reconnectAttempt;
      console.log(\`[\${roomLabel}] Reconnected after \${reconnectAttempt} attempts\`);
    }

    sendMediaEvent(meetingUuid, {
      event_type: 'rtms',
      action: 'stream_connected',
      metadata: { room_type: roomType, room_number: roomNumber, reconnect_attempt: reconnectAttempt }
    });
  });

  client.onLeave((reason) => {
    console.log(\`[\${roomLabel}] 🔌 Disconnected: \${reason}\`);
    logMetrics(meetingUuid);

    sendMediaEvent(meetingUuid, {
      event_type: 'rtms',
      action: 'stream_disconnected',
      metadata: { reason, room_type: roomType, room_number: roomNumber }
    });

    const connection = activeConnections.get(meetingUuid);
    if (connection && connection.shouldReconnect) {
      console.log(\`[\${roomLabel}] Initiating reconnection...\`);
      scheduleReconnect(meetingUuid, streamId, serverUrls, roomType, roomNumber, reconnectAttempt);
    } else {
      activeConnections.delete(meetingUuid);
      connectionMetrics.delete(meetingUuid);
      cancelReconnect(meetingUuid);
    }
  });

  client.onError((error) => {
    console.error(\`[\${roomLabel}] ❌ Error: \${error.message || error}\`);

    sendMediaEvent(meetingUuid, {
      event_type: 'error',
      action: 'client_error',
      metadata: { error: error.message || String(error), room_type: roomType, room_number: roomNumber }
    });
  });

  // ========== DATA HANDLERS ==========

  client.onTranscriptData((buffer, size, timestamp, metadata) => {
    try {
      const content = buffer.toString('utf8');
      console.log(\`[\${roomLabel}] 💬 \${metadata.userName}: \${content.substring(0, 100)}\${content.length > 100 ? '...' : ''}\`);

      updateMetrics(meetingUuid, {
        transcriptCount: (connectionMetrics.get(meetingUuid)?.transcriptCount || 0) + 1
      });

      sendTranscript(meetingUuid, {
        speaker_name: metadata.userName,
        content,
        timestamp_ms: timestamp,
        participant_id: metadata.userId,
        is_final: true
      });
    } catch (error) {
      console.error(\`[\${roomLabel}] Error processing transcript:\`, error.message);
    }
  });

  client.onAudioData((buffer, size, timestamp, metadata) => {
    try {
      updateMetrics(meetingUuid, {
        audioChunkCount: (connectionMetrics.get(meetingUuid)?.audioChunkCount || 0) + 1,
        bytesProcessed: (connectionMetrics.get(meetingUuid)?.bytesProcessed || 0) + size
      });

      // Log audio data periodically (every 100 chunks to avoid spam)
      const count = connectionMetrics.get(meetingUuid)?.audioChunkCount || 0;
      if (count % 100 === 0) {
        console.log(\`[\${roomLabel}] 🎵 Processed \${count} audio chunks (\${(connectionMetrics.get(meetingUuid)?.bytesProcessed / 1024 / 1024).toFixed(2)} MB)\`);
      }
    } catch (error) {
      console.error(\`[\${roomLabel}] Error processing audio:\`, error.message);
    }
  });

  client.onUserUpdate((op, participantInfo) => {
    try {
      updateMetrics(meetingUuid, {
        participantUpdates: (connectionMetrics.get(meetingUuid)?.participantUpdates || 0) + 1
      });

      if (op === 'add') {
        console.log(\`[\${roomLabel}] 👤 \${participantInfo.userName} joined\`);
        sendParticipantUpdate(meetingUuid, {
          action: 'joined',
          participant_id: participantInfo.userId,
          user_name: participantInfo.userName,
          email: participantInfo.userEmail,
          role: participantInfo.userRole
        });
      } else if (op === 'delete') {
        console.log(\`[\${roomLabel}] 👋 \${participantInfo.userName} left\`);
        sendParticipantUpdate(meetingUuid, {
          action: 'left',
          participant_id: participantInfo.userId,
          user_name: participantInfo.userName
        });
      }
    } catch (error) {
      console.error(\`[\${roomLabel}] Error processing participant update:\`, error.message);
    }
  });

  // ========== AUDIO CONFIGURATION ==========
  // Configuration based on Zoom RTMS samples best practices
  // Format: L16 PCM, 16kHz, Mono for optimal transcription compatibility

  try {
    client.setAudioParams({
      contentType: rtms.AudioContentType.RAW_AUDIO,
      codec: rtms.AudioCodec.OPUS,
      sampleRate: rtms.AudioSampleRate.SR_16K,    // 16kHz - industry standard for speech
      channel: rtms.AudioChannel.MONO,             // Mono - recommended for transcription
      dataOpt: rtms.AudioDataOption.AUDIO_MIXED_STREAM,  // Mixed stream combines all participants
      duration: 20,                                 // 20ms frames
      frameSize: 640                               // Bytes per frame (16kHz * 20ms * 2 bytes/sample)
    });
    console.log(\`[\${roomLabel}] 🎛️  Audio configured: 16kHz Mono, 20ms frames\`);
  } catch (error) {
    console.error(\`[\${roomLabel}] Failed to configure audio parameters:\`, error.message);
  }

  // ========== JOIN MEETING ==========

  try {
    const signature = generateSignature(meetingUuid, streamId);
    client.join({
      meeting_uuid: meetingUuid,
      rtms_stream_id: streamId,
      server_urls: serverUrls,
      signature
    });

    activeConnections.set(meetingUuid, {
      client,
      roomType,
      roomNumber,
      shouldReconnect: true,
      connectedAt: new Date()
    });

  } catch (error) {
    console.error(\`[\${roomLabel}] Failed to join meeting:\`, error.message);

    if (reconnectAttempt < MAX_RETRIES) {
      scheduleReconnect(meetingUuid, streamId, serverUrls, roomType, roomNumber, reconnectAttempt);
    }
  }

  return client;
}

// ============================================================================
// WEBHOOK EVENT HANDLING
// ============================================================================

function handleWebhookEvent(event, payload) {
  console.log(\`📥 Received webhook event: \${event}\`);

  try {
    if (event === 'meeting.rtms_started') {
      const { meeting_uuid, rtms_stream_id, server_urls } = payload;

      if (!meeting_uuid || !rtms_stream_id) {
        console.error('Invalid webhook payload: missing required fields');
        return;
      }

      const topic = payload.object?.topic || 'Untitled Meeting';
      console.log(\`🚀 Starting RTMS stream for: \${topic}\`);

      let roomType = 'main';
      let roomNumber = null;

      const breakoutMatch = topic.match(/Breakout Room (\\d+)/i);
      if (breakoutMatch) {
        roomType = 'breakout';
        roomNumber = parseInt(breakoutMatch[1]);

        if (roomNumber < 1 || roomNumber > 8) {
          console.warn(\`Invalid breakout room number: \${roomNumber}. Expected 1-8.\`);
          roomNumber = null;
          roomType = 'main';
        }
      }

      const serverUrlsStr = Array.isArray(server_urls)
        ? server_urls.join(',')
        : server_urls;

      connectToMeeting(
        meeting_uuid,
        rtms_stream_id,
        serverUrlsStr,
        roomType,
        roomNumber
      );

    } else if (event === 'meeting.rtms_stopped') {
      const { meeting_uuid } = payload;
      const connection = activeConnections.get(meeting_uuid);

      if (connection) {
        const roomLabel = connection.roomType === 'main'
          ? 'Main Conference Room'
          : \`Breakout Room \${connection.roomNumber}\`;

        console.log(\`[\${roomLabel}] 🛑 Meeting ended by host\`);
        logMetrics(meeting_uuid);

        connection.shouldReconnect = false;
        connection.client.leave();

        activeConnections.delete(meeting_uuid);
        connectionMetrics.delete(meeting_uuid);
        cancelReconnect(meeting_uuid);
      }
    }
  } catch (error) {
    console.error('Error handling webhook event:', error.message);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

function shutdown() {
  console.log('\\n🛑 Shutting down gracefully...');

  let disconnected = 0;
  for (const [meetingUuid, connection] of activeConnections.entries()) {
    try {
      connection.shouldReconnect = false;
      connection.client.leave();
      logMetrics(meetingUuid);
      disconnected++;
    } catch (error) {
      console.error(\`Error disconnecting from \${meetingUuid}:\`, error.message);
    }
  }

  activeConnections.clear();
  connectionMetrics.clear();

  for (const timer of reconnectTimers.values()) {
    clearTimeout(timer);
  }
  reconnectTimers.clear();

  console.log(\`✅ Disconnected from \${disconnected} meeting(s)\`);
  console.log('👋 Goodbye!');

  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ============================================================================
// STATUS MONITORING
// ============================================================================

setInterval(() => {
  if (activeConnections.size > 0) {
    console.log(\`\\n📊 Active Connections: \${activeConnections.size}\`);
    for (const [meetingUuid, connection] of activeConnections.entries()) {
      logMetrics(meetingUuid);
    }
  }
}, 60000); // Log every 60 seconds

// ============================================================================
// INITIALIZATION
// ============================================================================

validateEnvironment();

console.log('\\n🚀 RTMS Multi-Room Client - Production Ready');
console.log('📡 Listening for webhook events...');
console.log('🏠 Supports: 1 Main + 8 Breakout Rooms');
console.log('🔄 Auto-reconnect: Enabled');
console.log('📊 Metrics tracking: Enabled');
console.log('✨ Ready to process meetings!\\n');

// Export for webhook integration
module.exports = {
  connectToMeeting,
  handleWebhookEvent,
  activeConnections,
  connectionMetrics,
  shutdown
};
`;
}

export function generateEnvTemplate(supabaseUrl: string): string {
  return `# Zoom OAuth App Credentials
# Get these from your OAuth app (NOT Server-to-Server OAuth) in Zoom Marketplace
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
ZOOM_WEBHOOK_SECRET=your_webhook_secret_here

# Note: OAuth apps use Client ID and Client Secret only
# Account ID is NOT required for OAuth apps

# Supabase Configuration (automatically provided)
SUPABASE_URL=${supabaseUrl}
DATA_INGESTION_ENDPOINT=${supabaseUrl}/functions/v1/rtms-data
WEBHOOK_ENDPOINT=${supabaseUrl}/functions/v1/zoom-webhook
`;
}

export function generateNpmInstallCommand(): string {
  return 'npm install @zoom/rtms node-fetch';
}

export function generateCurlTestCommand(endpoint: string, meetingUuid?: string): string {
  const uuid = meetingUuid || 'test-meeting-123';
  return `curl -X POST '${endpoint}/transcript' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "transcript",
    "meeting_uuid": "${uuid}",
    "speaker_name": "Test Speaker",
    "content": "This is a test transcript",
    "timestamp_ms": ${Date.now()},
    "is_final": true
  }'`;
}

export function generatePowerShellTestCommand(endpoint: string, meetingUuid?: string): string {
  const uuid = meetingUuid || 'test-meeting-123';
  return `$body = @{
    type = "transcript"
    meeting_uuid = "${uuid}"
    speaker_name = "Test Speaker"
    content = "This is a test transcript from PowerShell"
    timestamp_ms = [long](Get-Date -UFormat %s) * 1000
    is_final = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "${endpoint}/transcript" \`
    -Method POST \`
    -ContentType "application/json" \`
    -Body $body`;
}

export function generatePowerShellChatCommand(endpoint: string, meetingUuid?: string): string {
  const uuid = meetingUuid || 'test-meeting-123';
  return `$body = @{
    type = "chat"
    meeting_uuid = "${uuid}"
    sender_name = "Test User"
    message = "Hello from PowerShell!"
    timestamp_ms = [long](Get-Date -UFormat %s) * 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "${endpoint}/chat" \`
    -Method POST \`
    -ContentType "application/json" \`
    -Body $body`;
}

export function generatePowerShellParticipantCommand(endpoint: string, meetingUuid?: string): string {
  const uuid = meetingUuid || 'test-meeting-123';
  return `$body = @{
    type = "participant"
    meeting_uuid = "${uuid}"
    action = "joined"
    participant_id = "test-participant-$(Get-Random)"
    user_name = "Test Participant"
    role = "attendee"
} | ConvertTo-Json

Invoke-RestMethod -Uri "${endpoint}/participant" \`
    -Method POST \`
    -ContentType "application/json" \`
    -Body $body`;
}

export function generateCurlChatCommand(endpoint: string, meetingUuid?: string): string {
  const uuid = meetingUuid || 'test-meeting-123';
  return `curl -X POST '${endpoint}/chat' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "chat",
    "meeting_uuid": "${uuid}",
    "sender_name": "Test User",
    "message": "Hello from the test!",
    "timestamp_ms": ${Date.now()}
  }'`;
}

export function generateCurlParticipantCommand(endpoint: string, meetingUuid?: string): string {
  const uuid = meetingUuid || 'test-meeting-123';
  return `curl -X POST '${endpoint}/participant' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "participant",
    "meeting_uuid": "${uuid}",
    "action": "joined",
    "participant_id": "test-participant-001",
    "user_name": "Test Participant",
    "role": "attendee"
  }'`;
}

export function generateWebhookTestPayload(): string {
  return JSON.stringify({
    event: "meeting.rtms_started",
    payload: {
      meeting_uuid: "test-meeting-uuid",
      rtms_stream_id: "test-stream-id",
      server_urls: ["wss://rtms.zoom.us"],
      operator_id: "test-operator-id",
      operator: {
        display_name: "Test Host"
      },
      object: {
        topic: "Test Meeting",
        host: {
          name: "Test Host"
        }
      }
    }
  }, null, 2);
}
