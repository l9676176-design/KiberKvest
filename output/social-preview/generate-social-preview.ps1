$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Out = $PSScriptRoot
$SlidesDir = Join-Path $Out 'carousel-02-slides'
$Mission1 = Join-Path $Root 'src\assets\missions\mission-01'
$Mission2 = Join-Path $Root 'src\assets\missions\mission-02'
$PptPath = Join-Path $Out 'carousel-02-source.pptx'
$ReelPptPath = Join-Path $Out 'reels-01-source.pptx'
$ReelPath = Join-Path $Out 'reels-01-nikomu-ne-nazyvai-kod.mp4'
$AudioPath = Join-Path $Out 'reels-01-sound-design.wav'
$ContactPath = Join-Path $Out 'carousel-02-contact-sheet.png'

New-Item -ItemType Directory -Path $SlidesDir -Force | Out-Null

function Rgb([int]$r, [int]$g, [int]$b) { return $r + 256 * $g + 65536 * $b }
$C = @{
  Ink = Rgb 10 20 48
  Night = Rgb 12 21 54
  Blue = Rgb 31 111 235
  Cyan = Rgb 46 207 255
  Purple = Rgb 119 76 255
  Yellow = Rgb 255 205 58
  Red = Rgb 239 64 73
  Green = Rgb 30 190 108
  White = Rgb 255 255 255
  Pale = Rgb 238 245 255
  Black = Rgb 0 0 0
}

function Add-Rect($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [double]$transparency = 0, [double]$radius = 0) {
  $kind = if ($radius -gt 0) { 5 } else { 1 }
  $shape = $slide.Shapes.AddShape($kind, $x, $y, $w, $h)
  $shape.Fill.Solid()
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Fill.Transparency = $transparency
  $shape.Line.Visible = 0
  return $shape
}

function Add-Text($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [double]$size, [int]$color, [string]$font = 'Bahnschrift', [bool]$bold = $true, [int]$align = 1) {
  $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
  $shape.TextFrame2.WordWrap = -1
  $shape.TextFrame2.MarginLeft = 8
  $shape.TextFrame2.MarginRight = 8
  $shape.TextFrame2.MarginTop = 4
  $shape.TextFrame2.MarginBottom = 4
  $shape.TextFrame2.TextRange.Text = $text.Replace('\n', "`n")
  $shape.TextFrame2.TextRange.Font.Name = $font
  $shape.TextFrame2.TextRange.Font.Size = $size
  $shape.TextFrame2.TextRange.Font.Bold = if ($bold) { -1 } else { 0 }
  $shape.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = $color
  $shape.TextFrame2.TextRange.ParagraphFormat.Alignment = $align
  $shape.TextFrame2.VerticalAnchor = 3
  return $shape
}

function Add-ImageCover($slide, [string]$path, [double]$sw, [double]$sh) {
  $pic = $slide.Shapes.AddPicture($path, 0, -1, 0, 0)
  $pic.LockAspectRatio = -1
  $ratioSlide = $sw / $sh
  $ratioPic = $pic.Width / $pic.Height
  if ($ratioPic -gt $ratioSlide) {
    $pic.Height = $sh
    $pic.Left = ($sw - $pic.Width) / 2
    $pic.Top = 0
  } else {
    $pic.Width = $sw
    $pic.Top = ($sh - $pic.Height) / 2
    $pic.Left = 0
  }
  return $pic
}

function Add-Brand($slide, [double]$sw) {
  $pill = Add-Rect $slide 36 30 180 38 $C.Night 0.08 16
  $pill.Line.Visible = -1
  $pill.Line.ForeColor.RGB = $C.Cyan
  $pill.Line.Weight = 1.4
  Add-Text $slide 'КИБЕРКВЕСТ' 45 32 162 32 15 $C.White 'Bahnschrift' $true 2 | Out-Null
  Add-Text $slide '●' ($sw - 72) 34 30 30 16 $C.Yellow 'Arial' $true 2 | Out-Null
}

function Add-Progress($slide, [int]$n, [int]$total, [double]$sw, [double]$sh) {
  for ($i = 1; $i -le $total; $i++) {
    $color = if ($i -le $n) { $C.Yellow } else { $C.White }
    $alpha = if ($i -le $n) { 0 } else { 0.65 }
    Add-Rect $slide (36 + (($i - 1) * (($sw - 72) / $total))) ($sh - 28) ((($sw - 72) / $total) - 8) 5 $color $alpha 2 | Out-Null
  }
}

function Add-CarouselBase($presentation, [string]$imagePath, [int]$n) {
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
  Add-ImageCover $slide $imagePath 720 900 | Out-Null
  Add-Rect $slide 0 0 720 900 $C.Night 0.42 | Out-Null
  Add-Rect $slide 0 0 720 205 $C.Night 0.18 | Out-Null
  Add-Rect $slide 0 655 720 245 $C.Night 0.12 | Out-Null
  Add-Brand $slide 720
  Add-Progress $slide $n 7 720 900
  return $slide
}

function Add-Choice($slide, [string]$letter, [string]$text, [double]$y, [int]$fill, [int]$line, [bool]$selected = $false) {
  $box = Add-Rect $slide 58 $y 604 94 $fill 0.08 18
  $box.Line.Visible = -1
  $box.Line.ForeColor.RGB = $line
  $box.Line.Weight = if ($selected) { 4 } else { 2 }
  Add-Rect $slide 76 ($y + 18) 58 58 $line 0 18 | Out-Null
  Add-Text $slide $letter 82 ($y + 22) 46 48 25 $C.White 'Bahnschrift' $true 2 | Out-Null
  Add-Text $slide $text 148 ($y + 11) 488 72 20 $C.White 'Segoe UI' $true 1 | Out-Null
}

function New-SoundDesign([string]$path) {
  $rate = 48000
  $seconds = 16
  $samples = $rate * $seconds
  $pcm = New-Object byte[] ($samples * 2)
  $events = @(
    @{t=1.0; d=.16; f=880; a=.20}, @{t=2.0; d=.16; f=1040; a=.20}, @{t=3.0; d=.18; f=1220; a=.22},
    @{t=4.0; d=.10; f=520; a=.14}, @{t=5.0; d=.10; f=480; a=.14}, @{t=6.0; d=.10; f=440; a=.14}, @{t=7.0; d=.10; f=380; a=.18},
    @{t=8.0; d=.35; f=125; a=.42}, @{t=9.0; d=.12; f=650; a=.16}, @{t=10.0; d=.12; f=760; a=.16}, @{t=11.0; d=.12; f=880; a=.18},
    @{t=14.0; d=.12; f=900; a=.18}, @{t=15.0; d=.42; f=660; a=.14}
  )
  for ($i = 0; $i -lt $samples; $i++) {
    $time = $i / $rate
    $v = 0.0
    foreach ($e in $events) {
      if ($time -ge $e.t -and $time -lt ($e.t + $e.d)) {
        $p = ($time - $e.t) / $e.d
        $env = [Math]::Sin([Math]::PI * $p)
        $v += [Math]::Sin(2 * [Math]::PI * $e.f * ($time - $e.t)) * $e.a * $env
      }
    }
    $sample = [int16]([Math]::Max(-1, [Math]::Min(1, $v)) * 32767)
    $bytes = [BitConverter]::GetBytes($sample)
    $pcm[$i * 2] = $bytes[0]
    $pcm[$i * 2 + 1] = $bytes[1]
  }
  $fs = [System.IO.File]::Create($path)
  $bw = New-Object System.IO.BinaryWriter($fs)
  $bw.Write([Text.Encoding]::ASCII.GetBytes('RIFF'))
  $bw.Write([int](36 + $pcm.Length))
  $bw.Write([Text.Encoding]::ASCII.GetBytes('WAVEfmt '))
  $bw.Write([int]16); $bw.Write([int16]1); $bw.Write([int16]1); $bw.Write([int]$rate)
  $bw.Write([int]($rate * 2)); $bw.Write([int16]2); $bw.Write([int16]16)
  $bw.Write([Text.Encoding]::ASCII.GetBytes('data'))
  $bw.Write([int]$pcm.Length); $bw.Write($pcm)
  $bw.Close(); $fs.Close()
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1

try {
  # Task 1: Carousel 02
  $pres = $ppt.Presentations.Add()
  $pres.PageSetup.SlideWidth = 720
  $pres.PageSetup.SlideHeight = 900

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-1.webp') 1
  Add-Text $s 'СООБЩЕНИЕ\nОТ «ПАПЫ»' 48 120 624 164 46 $C.White 'Bahnschrift' $true 1 | Out-Null
  Add-Text $s 'Что выберет ваш ребёнок?' 50 286 620 56 25 $C.Yellow 'Segoe UI' $true 1 | Out-Null
  $bubble = Add-Rect $s 82 520 556 188 $C.White 0.02 24
  $bubble.Line.Visible = -1; $bubble.Line.ForeColor.RGB = $C.Cyan; $bubble.Line.Weight = 2
  Add-Text $s 'ПАПА • новый номер' 108 540 490 30 15 $C.Blue 'Segoe UI' $true 1 | Out-Null
  Add-Text $s 'Я с нового номера.\nСрочно переведи 5 000 ₽.' 108 580 490 94 25 $C.Ink 'Segoe UI' $true 1 | Out-Null

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-2.webp') 2
  Add-Text $s 'ВАШ ВЫБОР?' 48 112 624 72 42 $C.White 'Bahnschrift' $true 1 | Out-Null
  Add-Text $s 'Что ответить прямо сейчас?' 50 180 620 48 22 $C.Yellow 'Segoe UI' $true 1 | Out-Null
  Add-Choice $s 'А' 'Сразу перевести деньги' 300 $C.Night $C.Red
  Add-Choice $s 'Б' 'Спросить, что случилось' 410 $C.Night $C.Yellow
  Add-Choice $s 'В' 'Позвонить папе по сохранённому номеру' 520 $C.Night $C.Green
  Add-Text $s 'Выберите до следующего слайда →' 72 640 576 56 19 $C.White 'Segoe UI' $true 2 | Out-Null

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-3.webp') 3
  Add-Text $s 'ПРАВИЛЬНО: В' 48 112 624 72 40 $C.Green 'Bahnschrift' $true 1 | Out-Null
  Add-Choice $s 'В' 'Позвонить папе по сохранённому номеру' 305 $C.Night $C.Green $true
  $panel = Add-Rect $s 58 430 604 220 $C.Night 0.03 22
  $panel.Line.Visible = -1; $panel.Line.ForeColor.RGB = $C.Cyan; $panel.Line.Weight = 2
  Add-Text $s 'Не отвечайте на новый номер.\nНе переводите деньги.\nПроверяйте просьбу другим способом.' 84 458 552 164 24 $C.White 'Segoe UI' $true 1 | Out-Null

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-4.webp') 4
  Add-Text $s '3 ПРИЗНАКА ОБМАНА' 48 112 624 72 38 $C.White 'Bahnschrift' $true 1 | Out-Null
  $items = @(@('01','НОВЫЙ НОМЕР',$C.Cyan),@('02','СРОЧНОСТЬ',$C.Yellow),@('03','ПРОСЬБА О ДЕНЬГАХ',$C.Red))
  for ($i=0; $i -lt 3; $i++) {
    $y = 285 + 112*$i
    Add-Rect $s 58 $y 604 92 $C.Night 0.05 18 | Out-Null
    Add-Text $s $items[$i][0] 76 ($y+12) 72 64 28 $items[$i][2] 'Bahnschrift' $true 2 | Out-Null
    Add-Text $s $items[$i][1] 158 ($y+11) 470 66 22 $C.White 'Segoe UI' $true 1 | Out-Null
  }

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-5.webp') 5
  Add-Text $s 'КАК РАБОТАЕТ ИГРА' 48 112 624 72 38 $C.White 'Bahnschrift' $true 1 | Out-Null
  Add-Text $s 'Ребёнок не слушает лекцию — он принимает решение.' 54 186 612 66 21 $C.Pale 'Segoe UI' $true 1 | Out-Null
  $flow = @(@('СЦЕНА','сообщение'),@('ВЫБОР','3 ответа'),@('ПОСЛЕДСТВИЕ','сразу'),@('ПРАВИЛО','на память'))
  for ($i=0; $i -lt 4; $i++) {
    $x = 44 + 166*$i
    Add-Rect $s $x 360 146 164 $C.Night 0.04 20 | Out-Null
    Add-Text $s ([string]($i+1)) ($x+44) 376 58 58 27 $C.Ink 'Bahnschrift' $true 2 | Out-Null
    $num = Add-Rect $s ($x+44) 376 58 58 $C.Yellow 0 20; $num.ZOrder(1)
    Add-Text $s ([string]($i+1)) ($x+44) 381 58 48 25 $C.Ink 'Bahnschrift' $true 2 | Out-Null
    Add-Text $s $flow[$i][0] ($x+8) 444 130 32 15 $C.White 'Bahnschrift' $true 2 | Out-Null
    Add-Text $s $flow[$i][1] ($x+8) 476 130 30 13 $C.Cyan 'Segoe UI' $true 2 | Out-Null
  }
  Add-Text $s '5–10 минут • дома, в классе, вместе с родителем' 70 575 580 54 18 $C.White 'Segoe UI' $true 2 | Out-Null

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-7.webp') 6
  Add-Text $s 'ПРАВИЛО МИССИИ' 48 112 624 72 38 $C.White 'Bahnschrift' $true 1 | Out-Null
  $steps = @(@('ОСТАНОВИСЬ',$C.Red),@('ПРОВЕРЬ',$C.Cyan),@('ПОЗВОНИ',$C.Green))
  for ($i=0; $i -lt 3; $i++) {
    $y=300+112*$i
    $b=Add-Rect $s 80 $y 560 88 $steps[$i][1] 0.04 18
    $b.Line.Visible=-1; $b.Line.ForeColor.RGB=$C.White; $b.Line.Weight=2
    Add-Text $s $steps[$i][0] 100 ($y+12) 520 62 27 $C.White 'Bahnschrift' $true 2 | Out-Null
  }
  Add-Text $s 'Срочность — повод замедлиться.' 74 655 572 56 21 $C.Yellow 'Segoe UI' $true 2 | Out-Null

  $s = Add-CarouselBase $pres (Join-Path $Mission2 'page-8.webp') 7
  Add-Text $s 'ПОПРОБУЙТЕ\n«КИБЕРКВЕСТ»' 48 118 624 136 43 $C.White 'Bahnschrift' $true 1 | Out-Null
  $cta = Add-Rect $s 62 520 596 176 $C.Yellow 0 24
  $cta.Line.Visible = -1; $cta.Line.ForeColor.RGB = $C.White; $cta.Line.Weight = 3
  Add-Text $s 'Напишите «КВЕСТ» —\nотправлю ссылку' 88 548 544 116 29 $C.Ink 'Bahnschrift' $true 2 | Out-Null
  Add-Text $s 'Игра, после которой ребёнок знает, что делать.' 70 710 580 60 19 $C.White 'Segoe UI' $true 2 | Out-Null

  $pres.SaveAs($PptPath)
  for ($i = 1; $i -le 7; $i++) {
    $pres.Slides.Item($i).Export((Join-Path $SlidesDir ('slide-{0:d2}.png' -f $i)), 'PNG', 1080, 1350)
  }
  $pres.Close()

  # Contact sheet from the seven verified exports.
  Add-Type -AssemblyName System.Drawing
  $thumbW=324; $thumbH=405; $gap=24; $margin=42; $cols=4; $rows=2
  $canvasW=$margin*2+$cols*$thumbW+($cols-1)*$gap
  $canvasH=120+$margin+$rows*$thumbH+($rows-1)*$gap+$margin
  $canvas=New-Object Drawing.Bitmap($canvasW,$canvasH)
  $g=[Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode='HighQuality'; $g.InterpolationMode='HighQualityBicubic'; $g.Clear([Drawing.Color]::FromArgb(10,20,48))
  $titleFont=New-Object Drawing.Font('Bahnschrift',28,[Drawing.FontStyle]::Bold)
  $smallFont=New-Object Drawing.Font('Segoe UI',13,[Drawing.FontStyle]::Regular)
  $white=New-Object Drawing.SolidBrush([Drawing.Color]::White)
  $cyan=New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb(46,207,255))
  $g.DrawString('КАРУСЕЛЬ №2 · СООБЩЕНИЕ ОТ ПАПЫ',$titleFont,$white,$margin,28)
  $g.DrawString('7 слайдов · 1080×1350',$smallFont,$cyan,$margin,78)
  for($i=1;$i -le 7;$i++){
    $col=($i-1)%4; $row=[Math]::Floor(($i-1)/4)
    $x=$margin+$col*($thumbW+$gap); $y=120+$row*($thumbH+$gap)
    $img=[Drawing.Image]::FromFile((Join-Path $SlidesDir ('slide-{0:d2}.png' -f $i)))
    $g.DrawImage($img,$x,$y,$thumbW,$thumbH); $img.Dispose()
  }
  $canvas.Save($ContactPath,[Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $canvas.Dispose(); $titleFont.Dispose(); $smallFont.Dispose(); $white.Dispose(); $cyan.Dispose()

  # Task 2: Reel 01, 16 seconds.
  New-SoundDesign $AudioPath
  $reel = $ppt.Presentations.Add()
  $reel.PageSetup.SlideWidth = 540
  $reel.PageSetup.SlideHeight = 960

  function Add-ReelBase([int]$n, [string]$imageName, [string]$caption) {
    $slide=$reel.Slides.Add($reel.Slides.Count+1,12)
    Add-ImageCover $slide (Join-Path $Mission1 $imageName) 540 960 | Out-Null
    Add-Rect $slide 0 0 540 960 $C.Night 0.48 | Out-Null
    Add-Rect $slide 0 0 540 100 $C.Night 0.1 | Out-Null
    Add-Text $slide 'КИБЕРКВЕСТ · МИССИЯ 01' 22 24 390 36 14 $C.White 'Bahnschrift' $true 1 | Out-Null
    Add-Text $slide ('{0:00}:00' -f ($n-1)) 430 24 88 36 14 $C.Cyan 'Bahnschrift' $true 2 | Out-Null
    Add-Rect $slide 18 852 504 82 $C.Black 0.12 14 | Out-Null
    Add-Text $slide $caption 34 866 472 52 20 $C.White 'Segoe UI' $true 2 | Out-Null
    $slide.SlideShowTransition.AdvanceOnTime=-1
    $slide.SlideShowTransition.AdvanceTime=1
    return $slide
  }

  function Add-Message($slide,[string]$title,[string]$text,[double]$y,[int]$accent){
    $m=Add-Rect $slide 34 $y 472 122 $C.White 0.03 22
    $m.Line.Visible=-1; $m.Line.ForeColor.RGB=$accent; $m.Line.Weight=2
    Add-Rect $slide 54 ($y+22) 48 48 $accent 0 16 | Out-Null
    Add-Text $slide '!' 58 ($y+24) 40 40 25 $C.White 'Bahnschrift' $true 2 | Out-Null
    Add-Text $slide $title 118 ($y+14) 350 34 15 $C.Blue 'Segoe UI' $true 1 | Out-Null
    Add-Text $slide $text 118 ($y+44) 350 62 22 $C.Ink 'Segoe UI' $true 1 | Out-Null
  }

  $s=Add-ReelBase 1 'page-1.webp' 'Одно сообщение может запустить опасный сценарий.'
  Add-Text $s 'НИКОМУ\nНЕ НАЗЫВАЙ КОД' 34 280 472 250 48 $C.White 'Bahnschrift' $true 2 | Out-Null
  Add-Text $s '16 секунд цифровой безопасности' 60 548 420 50 19 $C.Yellow 'Segoe UI' $true 2 | Out-Null

  $s=Add-ReelBase 2 'page-2.webp' '«Я сотрудник доставки».'
  Add-Message $s 'НОВЫЙ НОМЕР' 'Я сотрудник доставки' 190 $C.Cyan

  $s=Add-ReelBase 3 'page-2.webp' '«Назови код».'
  Add-Message $s 'НОВЫЙ НОМЕР' 'Я сотрудник доставки' 150 $C.Cyan
  Add-Message $s 'НОВЫЙ НОМЕР' 'Назови код' 292 $C.Yellow

  $s=Add-ReelBase 4 'page-2.webp' '«Иначе заказ пропадёт».'
  Add-Message $s 'НОВЫЙ НОМЕР' 'Я сотрудник доставки' 110 $C.Cyan
  Add-Message $s 'НОВЫЙ НОМЕР' 'Назови код' 252 $C.Yellow
  Add-Message $s 'НОВЫЙ НОМЕР' 'Иначе заказ пропадёт' 394 $C.Red

  $countdowns=@('05','04','03','02')
  for($i=0;$i -lt 4;$i++){
    $s=Add-ReelBase (5+$i) 'page-3.webp' ('Код 482 716. Осталось 00:{0}.' -f $countdowns[$i])
    Add-Text $s 'КОД ИЗ СМС' 80 170 380 50 22 $C.Cyan 'Bahnschrift' $true 2 | Out-Null
    $code=Add-Rect $s 54 240 432 150 $C.White 0.02 22
    $code.Line.Visible=-1; $code.Line.ForeColor.RGB=$C.Cyan; $code.Line.Weight=3
    Add-Text $s '482 716' 72 266 396 92 50 $C.Ink 'Bahnschrift' $true 2 | Out-Null
    Add-Text $s ('00:{0}' -f $countdowns[$i]) 98 430 344 154 (72-5*$i) $(if($i -ge 2){$C.Red}else{$C.Yellow}) 'Bahnschrift' $true 2 | Out-Null
    if($i -eq 3){
      $send=Add-Rect $s 306 640 178 72 $C.Blue 0 20
      Add-Text $s 'ОТПРАВИТЬ' 318 653 154 46 18 $C.White 'Bahnschrift' $true 2 | Out-Null
      Add-Text $s '➤' 238 614 90 90 56 $C.White 'Arial' $true 2 | Out-Null
    }
  }

  $s=Add-ReelBase 9 'page-4.webp' 'Стоп. Код нельзя передавать никому.'
  $stamp=Add-Rect $s 56 300 428 176 $C.Red 0.08 10
  $stamp.Line.Visible=-1; $stamp.Line.ForeColor.RGB=$C.White; $stamp.Line.Weight=5; $stamp.Rotation=-8
  $txt=Add-Text $s 'НЕ ПЕРЕДАВАТЬ' 72 338 396 92 39 $C.White 'Impact' $true 2
  $txt.Rotation=-8

  $ruleNames=@('ОСТАНОВИСЬ','ПРОВЕРЬ','СПРОСИ ВЗРОСЛОГО')
  $ruleColors=@($C.Red,$C.Cyan,$C.Green)
  for($i=0;$i -lt 3;$i++){
    $s=Add-ReelBase (10+$i) 'page-8.webp' $ruleNames[$i]
    Add-Text $s ([string]($i+1)) 188 240 164 164 86 $C.Ink 'Bahnschrift' $true 2 | Out-Null
    $circle=Add-Rect $s 188 240 164 164 $ruleColors[$i] 0 40; $circle.ZOrder(1)
    Add-Text $s ([string]($i+1)) 188 258 164 118 72 $C.White 'Bahnschrift' $true 2 | Out-Null
    Add-Text $s $ruleNames[$i] 32 450 476 112 $(if($i -eq 2){34}else{44}) $C.White 'Bahnschrift' $true 2 | Out-Null
  }

  $s=Add-ReelBase 13 'page-8.webp' 'Остановись → Проверь → Спроси взрослого.'
  Add-Text $s 'ПРАВИЛО МИССИИ' 55 180 430 64 28 $C.Yellow 'Bahnschrift' $true 2 | Out-Null
  for($i=0;$i -lt 3;$i++){
    $y=290+132*$i
    Add-Rect $s 54 $y 432 94 $ruleColors[$i] 0.05 18 | Out-Null
    Add-Text $s $ruleNames[$i] 72 ($y+14) 396 62 $(if($i -eq 2){24}else{29}) $C.White 'Bahnschrift' $true 2 | Out-Null
  }

  $s=Add-ReelBase 14 'page-6.webp' 'В игре ребёнок видит последствия своего выбора.'
  Add-Text $s 'КАК УСТРОЕН КВЕСТ' 40 150 460 64 29 $C.White 'Bahnschrift' $true 2 | Out-Null
  $receipt=Add-Rect $s 70 240 400 430 $C.White 0.01 8
  Add-Text $s 'СЦЕНА\n————————\nВЫБОР\n————————\nПОСЛЕДСТВИЕ\n————————\nПРАВИЛО' 98 274 344 348 28 $C.Ink 'Bahnschrift' $true 2 | Out-Null

  $s=Add-ReelBase 15 'page-8.webp' 'Напишите слово «КВЕСТ».'
  Add-Text $s 'ХОТИТЕ ПОПРОБОВАТЬ?' 48 180 444 70 28 $C.White 'Bahnschrift' $true 2 | Out-Null
  $comment=Add-Rect $s 40 310 460 112 $C.White 0.01 28
  Add-Text $s 'КВЕСТ' 70 332 330 66 36 $C.Ink 'Bahnschrift' $true 1 | Out-Null
  Add-Rect $s 408 326 70 70 $C.Blue 0 20 | Out-Null
  Add-Text $s '➤' 417 333 52 52 30 $C.White 'Arial' $true 2 | Out-Null

  $s=Add-ReelBase 16 'page-8.webp' 'Напишите «КВЕСТ» — отправлю ссылку.'
  Add-Text $s 'КИБЕРКВЕСТ' 46 220 448 78 42 $C.White 'Bahnschrift' $true 2 | Out-Null
  Add-Text $s 'Игра о цифровой\nи социальной безопасности' 54 310 432 100 23 $C.Pale 'Segoe UI' $true 2 | Out-Null
  $cta=Add-Rect $s 50 500 440 152 $C.Yellow 0 24
  Add-Text $s 'Напишите «КВЕСТ» —\nотправлю ссылку' 68 526 404 100 29 $C.Ink 'Bahnschrift' $true 2 | Out-Null

  $audio = $reel.Slides.Item(1).Shapes.AddMediaObject2($AudioPath, 0, -1, -100, -100, 1, 1)
  $audio.AnimationSettings.Animate = -1
  $audio.AnimationSettings.PlaySettings.PlayOnEntry = -1
  $audio.AnimationSettings.PlaySettings.StopAfterSlides = 16

  $reel.SaveAs($ReelPptPath)
  if(Test-Path -LiteralPath $ReelPath){ Remove-Item -LiteralPath $ReelPath -Force }
  $reel.CreateVideo($ReelPath, -1, 1, 1920, 30, 85)
  $deadline=(Get-Date).AddMinutes(12)
  do {
    Start-Sleep -Seconds 3
    $status=$reel.CreateVideoStatus
    if((Get-Date) -gt $deadline){ throw 'PowerPoint video export timed out.' }
  } while($status -eq 1 -or $status -eq 2)
  if($status -ne 3){ throw "PowerPoint video export failed with status $status" }
  $reel.Close()

  Write-Output "CREATED:$ContactPath"
  Write-Output "CREATED:$SlidesDir"
  Write-Output "CREATED:$ReelPath"
}
finally {
  if($pres){ try{$pres.Close()}catch{} }
  if($reel){ try{$reel.Close()}catch{} }
  $ppt.Quit()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
