# Script Name: Show-FolderTree.ps1
# PS 7+ version with ternary ?: and concise expressions

param(
    [string]$Path = ".",
    [int]$MaxDepth = 9999,
    [switch]$ShowSize,
    [switch]$Ascii,
    [switch]$IncludeHidden,
    [string[]]$Include = @(),      # ex: "*.js","*.ts"
    [string[]]$Exclude = @(),      # ex: "node_modules","*.log"
    [ValidateSet('Name','Time','Size')]
    [string]$SortBy = 'Name',
    [switch]$DirsOnly,
    [switch]$FilesOnly,
    [switch]$NoIcons
)

$script:DirCount   = 0
$script:FileCount  = 0
$script:TotalBytes = [long]0

function Format-Size([long]$Bytes) {
    $Bytes -ge 1GB ? ('{0:N2} GB' -f ($Bytes/1GB)) :
    $Bytes -ge 1MB ? ('{0:N2} MB' -f ($Bytes/1MB)) :
    $Bytes -ge 1KB ? ('{0:N2} KB' -f ($Bytes/1KB)) :
                     ("$Bytes B")
}

function Test-Match([System.IO.FileSystemInfo]$Item, [string[]]$Include, [string[]]$Exclude) {
    $name = $Item.Name
    if ($Include.Count -gt 0) {
        $in = $false
        foreach ($p in $Include) { if ($name -like $p) { $in = $true; break } }
        if (-not $in -and -not $Item.PSIsContainer) { return $false }
    }
    foreach ($p in $Exclude) { if ($name -like $p) { return $false } }
    return $true
}

function Get-SortedItems([string]$CurrentPath) {
    $items = Get-ChildItem -LiteralPath $CurrentPath -Force:$IncludeHidden.IsPresent -ErrorAction SilentlyContinue
    $items = $DirsOnly  ? ($items | Where-Object { $_.PSIsContainer }) :
             $FilesOnly ? ($items | Where-Object { -not $_.PSIsContainer }) :
                          $items
    $items = $items | Where-Object { Test-Match $_ $Include $Exclude }

    switch ($SortBy) {
        'Time' { $items | Sort-Object PSIsContainer, LastWriteTime, Name }
        'Size' { $items | Sort-Object PSIsContainer, @{ Expression = { $_.PSIsContainer ? -1 : $_.Length } }, Name }
        default { $items | Sort-Object PSIsContainer, Name }
    }
}

function Show-Tree([string]$CurrentPath, [string]$Prefix = "", [int]$Depth = 0) {
    $bar    = $Ascii ? '|'   : '│'
    $tee    = $Ascii ? '|--' : '├──'
    $elbow  = $Ascii ? '`--' : '└──'
    $space4 = $Ascii ? '   ' : '    '
    $folderIc = $NoIcons ? '[D]' : ($Ascii ? '[D]' : '📁')
    $fileIc   = $NoIcons ? '[F]' : ($Ascii ? '[F]' : '📄')

    if ($Depth -eq 0) {
        $rootName = Split-Path -Leaf -Path (Resolve-Path $CurrentPath)
        Write-Host "$folderIc $rootName"
    }
    if ($Depth -ge $MaxDepth) { return }

    $items = @(Get-SortedItems $CurrentPath)
    for ($i=0; $i -lt $items.Count; $i++){
        $item = $items[$i]
        $isLast = ($i -eq $items.Count - 1)
        $branch = $isLast ? $elbow : $tee
        $nextPrefix = $Prefix + ($isLast ? $space4 : ($bar + '   '))

        if ($item.PSIsContainer) {
            $script:DirCount++
            Write-Host "$Prefix$branch $folderIc $($item.Name)"
            # skip reparse points (symlinks/junctions) to avoid loops
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) {
                Show-Tree $item.FullName $nextPrefix ($Depth + 1)
            }
        } else {
            $script:FileCount++
            $script:TotalBytes += $item.Length
            $line = $ShowSize ? "$Prefix$branch $fileIc $($item.Name) ($(Format-Size $item.Length))"
                              : "$Prefix$branch $fileIc $($item.Name)"
            Write-Host $line
        }
    }
}

if (-not (Test-Path -LiteralPath $Path)) { Write-Host "❌ المسار غير موجود: $Path" -ForegroundColor Red; exit 1 }
try { [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8 } catch {}

Show-Tree (Resolve-Path $Path)

$sum = "📊 Summary: Directories=$script:DirCount, Files=$script:FileCount"
$sum = $ShowSize ? ($sum + ", TotalSize=$(Format-Size $script:TotalBytes)") : $sum
Write-Host $sum
