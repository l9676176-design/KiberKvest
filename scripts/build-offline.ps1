$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $projectRoot 'dist'
$downloadsPath = Join-Path $projectRoot 'downloads'
$zipPath = Join-Path $downloadsPath 'KiberKvest-offline.zip'

if (-not ([IO.Path]::GetFullPath($distPath).StartsWith([IO.Path]::GetFullPath($projectRoot), [StringComparison]::OrdinalIgnoreCase))) {
    throw 'The dist path is outside the project.'
}

if (Test-Path -LiteralPath $distPath) { Remove-Item -LiteralPath $distPath -Recurse -Force }
New-Item -ItemType Directory -Path $distPath -Force | Out-Null
New-Item -ItemType Directory -Path $downloadsPath -Force | Out-Null
Copy-Item -Path (Join-Path $projectRoot 'src\*') -Destination $distPath -Recurse -Force
$legacyPngFiles = Get-ChildItem -LiteralPath (Join-Path $distPath 'assets') -Recurse -File -Filter '*.png'
foreach ($legacyPngFile in $legacyPngFiles) {
    $webpPath = [IO.Path]::ChangeExtension($legacyPngFile.FullName, '.webp')
    if (Test-Path -LiteralPath $webpPath) { Remove-Item -LiteralPath $legacyPngFile.FullName -Force }
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'scripts\server.mjs') -Destination (Join-Path $distPath 'server.mjs') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'start-kiberkvest.cmd') -Destination (Join-Path $distPath 'start-kiberkvest.cmd') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'README.txt') -Destination (Join-Path $distPath 'README.txt') -Force

if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -Path (Join-Path $distPath '*') -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Build: $distPath"
Write-Host "Offline archive: $zipPath"
