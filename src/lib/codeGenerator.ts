interface Credentials {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  supabaseUrl: string;
  dataEndpoint: string;
}

export function generateNodeJSRTMSClient(credentials: Credentials): string {
  return `// Zoom RTMS Multi-Room Client
// Handles 1 main conference room + 8 breakout rooms simultaneously

const rtms = require('@zoom/rtms').default;
const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const ZOOM_CLIENT_ID = '${credentials.clientId || 'YOUR_CLIENT_ID'}';
const ZOOM_CLIENT_SECRET = '${credentials.clientSecret || 'YOUR_CLIENT_SECRET'}';
const DATA_ENDPOINT = '${credentials.dataEndpoint}';

// Store active meeting connections
const activeConnections = new Map();

// HMAC signature generator for RTMS authentication
function generateSignature(meetingUuid, streamId) {
  const message = \`\${ZOOM_CLIENT_ID},\${meetingUuid},\${streamId}\`;
  return crypto
    .createHmac('sha256', ZOOM_CLIENT_SECRET)
    .update(message)
    .digest('hex');
}

// Send transcript data to ingestion endpoint
async function sendTranscript(meetingUuid, transcriptData) {
  try {
    await fetch(\`\${DATA_ENDPOINT}/transcript\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transcript',
        meeting_uuid: meetingUuid,
        ...transcriptData
      })
    });
  } catch (error) {
    console.error('Error sending transcript:', error);
  }
}

// Send participant update to ingestion endpoint
async function sendParticipantUpdate(meetingUuid, participantData) {
  try {
    await fetch(\`\${DATA_ENDPOINT}/participant\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'participant',
        meeting_uuid: meetingUuid,
        ...participantData
      })
    });
  } catch (error) {
    console.error('Error sending participant update:', error);
  }
}

// Connect to a single RTMS meeting
function connectToMeeting(meetingUuid, streamId, serverUrls, roomType, roomNumber) {
  const client = new rtms.Client();

  const roomLabel = roomType === 'main'
    ? 'Main Conference Room'
    : \`Breakout Room \${roomNumber}\`;

  console.log(\`[\${roomLabel}] Connecting to meeting...\`);

  // Handle successful connection
  client.onJoinConfirm((reason) => {
    console.log(\`[\${roomLabel}] ✅ Connected successfully\`);
  });

  // Handle transcript data
  client.onTranscriptData((buffer, size, timestamp, metadata) => {
    const content = buffer.toString('utf8');
    console.log(\`[\${roomLabel}] 💬 \${metadata.userName}: \${content}\`);

    sendTranscript(meetingUuid, {
      speaker_name: metadata.userName,
      content,
      timestamp_ms: timestamp,
      participant_id: metadata.userId,
      is_final: true
    });
  });

  // Handle audio data (optional processing)
  client.onAudioData((buffer, size, timestamp, metadata) => {
    // Process audio data if needed
    console.log(\`[\${roomLabel}] 🎵 Audio from \${metadata.userName}: \${size} bytes\`);
  });

  // Handle participant join
  client.onUserUpdate((op, participantInfo) => {
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
  });

  // Handle disconnection
  client.onLeave((reason) => {
    console.log(\`[\${roomLabel}] Disconnected: \${reason}\`);
    activeConnections.delete(meetingUuid);
  });

  // Configure audio parameters
  client.setAudioParams({
    contentType: rtms.AudioContentType.RAW_AUDIO,
    codec: rtms.AudioCodec.OPUS,
    sampleRate: rtms.AudioSampleRate.SR_16K,
    channel: rtms.AudioChannel.STEREO,
    dataOpt: rtms.AudioDataOption.AUDIO_MIXED_STREAM,
    duration: 20,
    frameSize: 640
  });

  // Join the meeting
  const signature = generateSignature(meetingUuid, streamId);
  client.join({
    meeting_uuid: meetingUuid,
    rtms_stream_id: streamId,
    server_urls: serverUrls,
    signature
  });

  activeConnections.set(meetingUuid, { client, roomType, roomNumber });
  return client;
}

// Webhook handler to automatically connect when meetings start
function handleWebhookEvent(event, payload) {
  if (event === 'meeting.rtms_started') {
    const { meeting_uuid, rtms_stream_id, server_urls } = payload;

    // Determine room type and number from meeting topic or metadata
    const topic = payload.object?.topic || '';
    let roomType = 'main';
    let roomNumber = null;

    // Example: "Breakout Room 3" -> roomType='breakout', roomNumber=3
    const breakoutMatch = topic.match(/Breakout Room (\\d+)/i);
    if (breakoutMatch) {
      roomType = 'breakout';
      roomNumber = parseInt(breakoutMatch[1]);
    }

    connectToMeeting(
      meeting_uuid,
      rtms_stream_id,
      Array.isArray(server_urls) ? server_urls.join(',') : server_urls,
      roomType,
      roomNumber
    );
  } else if (event === 'meeting.rtms_stopped') {
    const { meeting_uuid } = payload;
    const connection = activeConnections.get(meeting_uuid);
    if (connection) {
      console.log(\`Meeting \${meeting_uuid} ended\`);
      connection.client.leave();
    }
  }
}

// Example: Connect to meetings directly (if you have the details)
// Uncomment and fill in your meeting details for testing
/*
connectToMeeting(
  'YOUR_MEETING_UUID',
  'YOUR_STREAM_ID',
  'wss://rtms.zoom.us',
  'main',
  null
);
*/

// Export for webhook integration
module.exports = {
  connectToMeeting,
  handleWebhookEvent,
  activeConnections
};

console.log('🚀 RTMS Multi-Room Client Ready');
console.log('📡 Listening for webhook events...');
console.log('🏠 Supports: 1 Main + 8 Breakout Rooms');
`;
}

export function generateEnvTemplate(supabaseUrl: string): string {
  return `# Zoom OAuth Credentials
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
ZOOM_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Configuration (automatically provided)
SUPABASE_URL=${supabaseUrl}
DATA_INGESTION_ENDPOINT=${supabaseUrl}/functions/v1/rtms-data
WEBHOOK_ENDPOINT=${supabaseUrl}/functions/v1/zoom-webhook
`;
}

export function generateNpmInstallCommand(): string {
  return 'npm install @zoom/rtms node-fetch';
}

export function generateCurlTestCommand(endpoint: string): string {
  return `curl -X POST '${endpoint}/transcript' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "transcript",
    "meeting_uuid": "test-meeting-123",
    "speaker_name": "Test Speaker",
    "content": "This is a test transcript",
    "timestamp_ms": ${Date.now()},
    "is_final": true
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
