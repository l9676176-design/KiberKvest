$ErrorActionPreference = 'Stop'
$Video = Join-Path $PSScriptRoot 'reels-01-nikomu-ne-nazyvai-kod.mp4'
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
  [pscustomobject]@{Status='PASS'; PlaybackPositionSeconds=$position; PlayerState=$state} | Format-List
} finally {
  if($pres){ try{$pres.Close()}catch{} }
  $ppt.Quit()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
