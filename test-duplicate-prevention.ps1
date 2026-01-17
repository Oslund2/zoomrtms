# PowerShell Script to Test Duplicate Prevention
# This script demonstrates proper duplicate detection

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjb2xtb2lzenltbm11cmViemFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDg4MTIsImV4cCI6MjA4Mzk4NDgxMn0.W08Vak3ilCPZqPuH03q4tGJHFvNxJXnu0noV82KySmU"
}

$url = "https://scolmoiszymnmurebzal.supabase.co/functions/v1/rtms-data/transcript"

# Use a fixed timestamp for duplicate testing
$fixedTimestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()

$transcriptContent = @"
[00:00:01] Alex: Honestly, this new contract intake system is a mess. I tried submitting a request yesterday and it took longer than the old email process.

[00:00:09] Jamie: Same. The form is confusing, half the fields don't make sense, and if you answer one thing wrong it just resets. It's frustrating.

[00:00:17] Priya: And from Legal's side, it's not better. We're still missing key details, plus now we're getting duplicate submissions because people don't trust it.

[00:00:24] Alex: Yeah, morale's taking a hit. If this is supposed to speed things up, it's doing the exact opposite.
"@

# Test 1: First submission (should succeed)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 1: First Submission (Should Succeed)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$body1 = @{
    type = "transcript"
    meeting_uuid = "test-meeting-123"
    participant_id = "test-participant-001"
    speaker_name = "Testy Two"
    content = $transcriptContent
    timestamp_ms = $fixedTimestamp
    is_final = $true
    room_type = "breakout"
    room_number = 1
} | ConvertTo-Json

Write-Host "Timestamp: $fixedTimestamp" -ForegroundColor Yellow

try {
    $response1 = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body1
    Write-Host "Response:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Wait a moment
Start-Sleep -Seconds 2

# Test 2: Exact duplicate with same timestamp (should be prevented)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Exact Duplicate (Should Be Prevented)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$body2 = @{
    type = "transcript"
    meeting_uuid = "test-meeting-123"
    participant_id = "test-participant-001"
    speaker_name = "Testy Two"
    content = $transcriptContent
    timestamp_ms = $fixedTimestamp
    is_final = $true
    room_type = "breakout"
    room_number = 1
} | ConvertTo-Json

Write-Host "Timestamp: $fixedTimestamp (same as first)" -ForegroundColor Yellow

try {
    $response2 = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body2
    Write-Host "Response:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 5

    if ($response2.duplicate -eq $true) {
        Write-Host "`n✓ SUCCESS: Duplicate was correctly prevented!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ FAILURE: Duplicate was NOT prevented!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Wait a moment
Start-Sleep -Seconds 2

# Test 3: Duplicate with slightly different timestamp (within 5s window, should be prevented)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Near-Duplicate with +2s Timestamp (Should Be Prevented)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$nearTimestamp = $fixedTimestamp + 2000  # 2 seconds later

$body3 = @{
    type = "transcript"
    meeting_uuid = "test-meeting-123"
    participant_id = "test-participant-001"
    speaker_name = "Testy Two"
    content = $transcriptContent
    timestamp_ms = $nearTimestamp
    is_final = $true
    room_type = "breakout"
    room_number = 1
} | ConvertTo-Json

Write-Host "Timestamp: $nearTimestamp (+2000ms from first)" -ForegroundColor Yellow

try {
    $response3 = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body3
    Write-Host "Response:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 5

    if ($response3.duplicate -eq $true) {
        Write-Host "`n✓ SUCCESS: Near-duplicate was correctly prevented!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ FAILURE: Near-duplicate was NOT prevented!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Wait a moment
Start-Sleep -Seconds 2

# Test 4: Different content (should succeed)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 4: Different Content (Should Succeed)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$differentContent = "[00:00:30] Alex: Let's move on to the next topic."

$body4 = @{
    type = "transcript"
    meeting_uuid = "test-meeting-123"
    participant_id = "test-participant-001"
    speaker_name = "Testy Two"
    content = $differentContent
    timestamp_ms = $fixedTimestamp
    is_final = $true
    room_type = "breakout"
    room_number = 1
} | ConvertTo-Json

Write-Host "Timestamp: $fixedTimestamp (same timestamp, different content)" -ForegroundColor Yellow

try {
    $response4 = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body4
    Write-Host "Response:" -ForegroundColor Green
    $response4 | ConvertTo-Json -Depth 5

    if ($response4.duplicate -ne $true) {
        Write-Host "`n✓ SUCCESS: Different content was correctly accepted!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ FAILURE: Different content was incorrectly marked as duplicate!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
