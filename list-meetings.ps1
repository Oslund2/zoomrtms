# List all meetings in the database

$supabaseUrl = "https://scolmoiszymnmurebzal.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjb2xtb2lzenltbm11cmViemFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDg4MTIsImV4cCI6MjA4Mzk4NDgxMn0.W08Vak3ilCPZqPuH03q4tGJHFvNxJXnu0noV82KySmU"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

Write-Host "Fetching all meetings from database..." -ForegroundColor Cyan

try {
    $meetings = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/meetings?select=meeting_uuid,topic,status,room_type,created_at" -Method Get -Headers $headers

    if ($meetings.Count -eq 0) {
        Write-Host "`nNo meetings found in database." -ForegroundColor Yellow
        Write-Host "Run .\test-transcript-api.ps1 to create a test meeting." -ForegroundColor Gray
    } else {
        Write-Host "`nFound $($meetings.Count) meeting(s):" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Gray

        foreach ($meeting in $meetings) {
            Write-Host "`nMeeting UUID: $($meeting.meeting_uuid)" -ForegroundColor Yellow
            Write-Host "  Topic: $($meeting.topic)" -ForegroundColor White
            Write-Host "  Status: $($meeting.status)" -ForegroundColor $(if ($meeting.status -eq "active") { "Green" } else { "Gray" })
            Write-Host "  Room Type: $($meeting.room_type)" -ForegroundColor White
            Write-Host "  Created: $($meeting.created_at)" -ForegroundColor Gray
        }

        Write-Host "`n================================================" -ForegroundColor Gray
        Write-Host "Use any of these UUIDs to send transcripts." -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Error fetching meetings: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
