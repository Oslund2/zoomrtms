# Test script for sending transcripts to the application
# This script creates a meeting first, then sends a transcript

$supabaseUrl = "https://scolmoiszymnmurebzal.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjb2xtb2lzenltbm11cmViemFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDg4MTIsImV4cCI6MjA4Mzk4NDgxMn0.W08Vak3ilCPZqPuH03q4tGJHFvNxJXnu0noV82KySmU"

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

# Generate a unique meeting UUID
$meetingUuid = [guid]::NewGuid().ToString()

Write-Host "Step 1: Creating a test meeting..." -ForegroundColor Cyan
Write-Host "Meeting UUID: $meetingUuid" -ForegroundColor Yellow

# Create a meeting first
$createMeetingBody = @{
    meeting_uuid = $meetingUuid
    topic = "Test Meeting - Revenue Discussion"
    host_name = "Test Host"
    status = "active"
    room_type = "main"
    room_number = 0
} | ConvertTo-Json

try {
    $meetingResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/meetings" -Method Post -Headers $headers -Body $createMeetingBody
    Write-Host "✓ Meeting created successfully!" -ForegroundColor Green
    Write-Host "Meeting ID: $($meetingResponse.id)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error creating meeting: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

Write-Host "`nStep 2: Sending transcript..." -ForegroundColor Cyan

# Now send the transcript
$transcriptBody = @{
    type = "transcript"
    meeting_uuid = $meetingUuid
    participant_id = "test-participant-001"
    speaker_name = "Revenue Tester"
    content = "Money money money. This is a test transcript about revenue."
    timestamp_ms = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    is_final = $true
} | ConvertTo-Json

try {
    $transcriptResponse = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/rtms-data/transcript" -Method Post -Headers $headers -Body $transcriptBody
    Write-Host "✓ Transcript sent successfully!" -ForegroundColor Green
    Write-Host "Response: $($transcriptResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error sending transcript: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Sending another transcript..." -ForegroundColor Cyan

# Send another transcript to see multiple entries
$transcriptBody2 = @{
    type = "transcript"
    meeting_uuid = $meetingUuid
    participant_id = "test-participant-002"
    speaker_name = "Sales Director"
    content = "Q4 projections are looking great. We're on track to exceed our targets."
    timestamp_ms = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    is_final = $true
} | ConvertTo-Json

Start-Sleep -Milliseconds 500

try {
    $transcriptResponse2 = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/rtms-data/transcript" -Method Post -Headers $headers -Body $transcriptBody2
    Write-Host "✓ Second transcript sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Error sending second transcript: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "✓ Test completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "`nYou should now see:" -ForegroundColor Cyan
Write-Host "  • A new active meeting in the Dashboard" -ForegroundColor White
Write-Host "  • Transcripts in the 'Recent Transcripts' section" -ForegroundColor White
Write-Host "  • Click on any transcript to view the full meeting details" -ForegroundColor White
Write-Host "`nMeeting UUID: $meetingUuid" -ForegroundColor Yellow
