$ErrorActionPreference = 'Stop'
$Out = $PSScriptRoot
$Slides = Join-Path $Out 'carousel-02-slides'
$Contact = Join-Path $Out 'carousel-02-contact-sheet.png'
$Video = Join-Path $Out 'reels-01-nikomu-ne-nazyvai-kod.mp4'

Add-Type -AssemblyName System.Drawing
$pngs = @(Get-ChildItem -LiteralPath $Slides -Filter '*.png' -File | Sort-Object Name)
if ($pngs.Count -ne 7) { throw "Expected 7 PNG slides, found $($pngs.Count)." }
$slideReport = foreach ($file in $pngs) {
  if ($file.Length -le 0) { throw "Empty file: $($file.FullName)" }
  $img = [Drawing.Image]::FromFile($file.FullName)
  try {
    if ($img.Width -ne 1080 -or $img.Height -ne 1350) { throw "Wrong size: $($file.Name) = $($img.Width)x$($img.Height)" }
    [pscustomobject]@{File=$file.Name; Width=$img.Width; Height=$img.Height; Bytes=$file.Length}
  } finally { $img.Dispose() }
}

$contactFile = Get-Item -LiteralPath $Contact
if ($contactFile.Length -le 0) { throw 'Contact sheet is empty.' }
$contactImg = [Drawing.Image]::FromFile($Contact)
try {
  $contactReport = [pscustomobject]@{File=$contactFile.Name; Width=$contactImg.Width; Height=$contactImg.Height; Bytes=$contactFile.Length}
} finally { $contactImg.Dispose() }

$videoFile = Get-Item -LiteralPath $Video
if ($videoFile.Length -le 0) { throw 'MP4 is empty.' }
$shell = New-Object -ComObject Shell.Application
$folder = $shell.NameSpace($videoFile.DirectoryName)
$item = $folder.ParseName($videoFile.Name)
$vw = $item.ExtendedProperty('System.Video.FrameWidth')
$vh = $item.ExtendedProperty('System.Video.FrameHeight')
$duration100ns = $item.ExtendedProperty('System.Media.Duration')
$duration = if ($duration100ns) { [Math]::Round(([double]$duration100ns / 10000000), 2) } else { 0 }
if ($vw -ne 1080 -or $vh -ne 1920) { throw "Wrong MP4 dimensions: ${vw}x${vh}" }
if ($duration -lt 15 -or $duration -gt 18) { throw "Unexpected MP4 duration: $duration seconds" }

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
try {
  $pres = $ppt.Presentations.Add()
  $pres.PageSetup.SlideWidth = 540
  $pres.PageSetup.SlideHeight = 960
  $slide = $pres.Slides.Add(1,12)
  $media = $slide.Shapes.AddMediaObject2($Video,0,-1,0,0,540,960)
  $window = $pres.SlideShowSettings.Run()
  $player = $window.View.Player($media.Id)
  $player.Play()
  Start-Sleep -Seconds 2
  $position = [Math]::Round($player.CurrentPosition,2)
  $state = $player.State
  $player.Stop()
  $window.View.Exit()
  if($position -le 0){ throw "PowerPoint playback did not advance: $position" }
} finally {
  if($pres){ try{$pres.Close()}catch{} }
  $ppt.Quit()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

[pscustomobject]@{
  Status='PASS'
  Slides=$slideReport.Count
  SlideSize='1080x1350'
  ContactSheet="$($contactReport.Width)x$($contactReport.Height)"
  VideoSize="${vw}x${vh}"
  VideoDurationSeconds=$duration
  PlaybackPositionSeconds=$position
  PlaybackState=$state
  VideoBytes=$videoFile.Length
} | Format-List
$slideReport | Format-Table -AutoSize
