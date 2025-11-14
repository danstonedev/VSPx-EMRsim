# Simple HTTP server launcher (delegates to app/)
Write-Host "Starting PT EMR Simulator (serving app/) on http://localhost:3000"
Write-Host "Press Ctrl+C to stop the server"

# Build app folder path correctly (Join-Path only accepts two segments)
$appFolder = Join-Path $PSScriptRoot 'app'
$scriptPath = Join-Path $appFolder 'start_servers_simple.ps1'

if (Test-Path $scriptPath) {
	Push-Location $appFolder
	try {
		& powershell -NoProfile -ExecutionPolicy Bypass -File '.\start_servers_simple.ps1'
	}
 finally {
		Pop-Location
	}
}
else {
	Write-Warning "app/start_servers_simple.ps1 not found. Falling back to serving repo root."
	python -m http.server 3000
}
