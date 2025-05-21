param(
    [string]$FilePath
)

if (-Not (Test-Path $FilePath)) {
    Write-Host "Fayl topilmadi!"
    exit
}

for ($i=1; $i -le 9; $i++) {
    Start-Process -FilePath $FilePath
}
