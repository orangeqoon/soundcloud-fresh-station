[CmdletBinding()]
param([switch]$StagedOnly)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$extensions = @('.js', '.cjs', '.mjs', '.ts', '.json', '.html', '.css', '.ps1', '.py', '.bat')
if ($StagedOnly) {
    $paths = @(git -C $repoRoot diff --cached --name-only --diff-filter=ACM)
} else {
    $paths = @(git -C $repoRoot ls-files --cached --others --exclude-standard)
}
if ($LASTEXITCODE -ne 0) { throw 'Unable to enumerate this repository with git.' }
$findings = @()
$scanned = 0
foreach ($relative in $paths) {
    if ($relative -match '(^|/)(node_modules|dist|\.git)/') { continue }
    $fullPath = Join-Path $repoRoot $relative
    if (!(Test-Path -LiteralPath $fullPath -PathType Leaf)) { continue }
    if ([IO.Path]::GetExtension($relative).ToLowerInvariant() -notin $extensions) { continue }
    $scanned++
    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $fullPath -Encoding UTF8) {
        $lineNumber++
        if ($line -match '(?i)[a-z]:[\\/](scripts|users)[\\/]' -and $line -notmatch '(//|#)\s*allow-hardcode') {
            $findings += ('{0}:{1}' -f $relative, $lineNumber)
        }
    }
}
if ($findings.Count) {
    $findings | ForEach-Object { Write-Output $_ }
    Write-Error ('Hardcoded path check failed: {0} finding(s).' -f $findings.Count)
    exit 1
}
Write-Output ('Hardcoded path check passed: {0} file(s), 0 findings.' -f $scanned)
