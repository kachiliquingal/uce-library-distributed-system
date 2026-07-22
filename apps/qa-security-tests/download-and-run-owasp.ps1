$ErrorActionPreference = "Stop"

$Version = "10.0.3"
$ZipUrl = "https://github.com/jeremylong/DependencyCheck/releases/download/v$Version/dependency-check-$Version-release.zip"
$ZipFile = "$PSScriptRoot\dependency-check.zip"
$ExtractPath = "$PSScriptRoot\dependency-check-tool"

if (-not (Test-Path "$ExtractPath\dependency-check\bin\dependency-check.bat")) {
    Write-Host "Descargando OWASP Dependency-Check v$Version..."
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile

    Write-Host "Extrayendo archivo..."
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractPath -Force

    Write-Host "Limpiando archivo ZIP..."
    Remove-Item $ZipFile
}

Write-Host "Ejecutando OWASP Dependency-Check sobre el proyecto..."
$BatPath = "$ExtractPath\dependency-check\bin\dependency-check.bat"
$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."

# Ejecutar el escaneo sobre todos los package.json y package-lock.json de la carpeta apps
& $BatPath --project "UCE Library" --out "$PSScriptRoot\report" --scan "$ProjectRoot\apps\**\package*.json" --disableAssembly --disableBundleAudit

Write-Host "Escaneo finalizado. Revisa la carpeta apps/qa-security-tests/report para el archivo HTML."
