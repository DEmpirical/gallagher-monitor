# Generar certificado cliente para Gallagher usando PowerShell nativo
# Este script:
# 1. Crea un certificado auto-firmado en Current User → Personal
# 2. Lo exporta a PFX con contraseña
# 3. Muestra el thumbprint para usar en .env

$certName = "CommandCentreClient"
$friendlyName = "Gallagher Client"
$password = "123456"
$exportPath = Join-Path $PSScriptRoot "cert2\client.pfx"

# Crear carpeta cert2 si no existe
$cert2Dir = Split-Path $exportPath -Parent
if (-not (Test-Path $cert2Dir)) {
    New-Item -ItemType Directory -Force -Path $cert2Dir | Out-Null
}

# 1. Crear certificado auto-firmado en Windows Store
$cert = New-SelfSignedCertificate `
    -DnsName $certName `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName $friendlyName `
    -KeyUsage KeyEncipherment, DigitalSignature `
    -KeySpec KeyExchange `
    -KeyExportPolicy Exportable `
    -Provider "Microsoft RSA SChannel Cryptographic Provider" `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.2") # clientAuth EKU

if (-not $cert) {
    Write-Error "No se pudo crear el certificado"
    exit 1
}

Write-Host "✅ Certificado creado en Windows Store (Current User → Personal)"
Write-Host "   Subject: $($cert.Subject)"
Write-Host "   Thumbprint: $($cert.Thumbprint)"

# 2. Exportar a PFX
$pwdSecure = ConvertTo-SecureString -String $password -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $exportPath -Password $pwdSecure

Write-Host "`n✅ PFX exportado a: $exportPath"
Write-Host "   Contraseña del PFX: $password"

# 3. Instrucciones
Write-Host "`n📋 Para usar en backend/.env:"
Write-Host "GALLAGHER_CLIENT_CERT_THUMBPRINT=$($cert.Thumbprint)"
Write-Host "`n💾 Luego reinicia el backend y prueba la conexión."
