# generar-certificado-gallagher.ps1
# Genera un certificado cliente con private key y lo importa en Windows Store
# Guarda los archivos en la carpeta certs/ del proyecto

$certName = "CommandCentreClient"
$pfxPassword = "MiPassword123"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $projectRoot "certs"

# Crear carpeta certs si no existe
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

Write-Host "=== Generando certificado cliente para Gallagher ==="
Write-Host "Carpeta de salida: $outputDir"
Write-Host ""

# Verificar que OpenSSL esté disponible
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
    Write-Error "OpenSSL no está instalado o no está en el PATH. Instala OpenSSL desde: https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
}

Write-Host "1. Generando clave privada..."
openssl genrsa -out "$outputDir\client.key" 2048

Write-Host "2. Generando CSR (Certificate Signing Request)..."
openssl req -new -key "$outputDir\client.key" -out "$outputDir\client.csr" -subj "/CN=$certName/O=Redhood/C=US"

Write-Host "3. Autofirmando certificado (válido 2 años)..."
openssl x509 -req -days 730 -in "$outputDir\client.csr" -signkey "$outputDir\client.key" -out "$outputDir\client.crt"

Write-Host "4. Creando PFX para importar en Windows..."
openssl pkcs12 -export -out "$outputDir\client.pfx" -inkey "$outputDir\client.key" -in "$outputDir\client.crt" -passout pass:$pfxPassword

Write-Host "5. Importando en Windows Store (Current User → Personal)..."
$pwdSecure = ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText
Import-PfxCertificate -FilePath "$outputDir\client.pfx" -CertStoreLocation Cert:\CurrentUser\My -Password $pwdSecure

Write-Host "6. Obteniendo thumbprint del certificado importado..."
$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -like "*$certName*" } | Select-Object -First 1
if ($cert) {
    Write-Host "`n✅ Certificado generado e importado exitosamente!"
    Write-Host "`nThumbprint (sin espacios):" $cert.Thumbprint
    Write-Host "`n📋 Copia este valor a tu backend/.env:"
    Write-Host "GALLAGHER_CLIENT_CERT_THUMBPRINT=$($cert.Thumbprint)"
    Write-Host "`n📁 Archivos guardados en: $outputDir"
    Write-Host "  - client.key (clave privada)"
    Write-Host "  - client.crt (certificado)"
    Write-Host "  - client.pfx (paquete PKCS#12)"
} else {
    Write-Error "❌ No se encontró el certificado después de importar. Verifica que OpenSSL haya generado correctamente el PFX."
}

Write-Host "`nPresiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
