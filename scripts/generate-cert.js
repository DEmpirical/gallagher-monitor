#!/usr/bin/env node
// Generar certificado cliente para Gallagher usando OpenSSL
// No requiere dependencias Node adicionalas

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.resolve(process.cwd(), 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, 'client.key');
const csrPath = path.join(certsDir, 'client.csr');
const crtPath = path.join(certsDir, 'client.crt');
const pfxPath = path.join(certsDir, 'client.pfx');
const password = '123456'; // Contraseña simple para el PFX

console.log('Generando certificado cliente para Gallagher...');

try {
  // 1. Clave privada
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });

  // 2. CSR
  const subject = '/CN=CommandCentreClient/O=Redhood/C=US';
  execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "${subject}"`, { stdio: 'inherit' });

  // 3. Certificado autofirmado (2 años)
  execSync(`openssl x509 -req -days 730 -in "${csrPath}" -signkey "${keyPath}" -out "${crtPath}"`, { stdio: 'inherit' });

  // 4. PFX
  execSync(`openssl pkcs12 -export -out "${pfxPath}" -inkey "${keyPath}" -in "${crtPath}" -passout pass:${password}`, { stdio: 'inherit' });

  // 5. Thumbprint (SHA1)
  const stdout = execSync(`openssl x509 -fingerprint -sha1 -noout -in "${crtPath}"`).toString();
  const match = stdout.match(/SHA1 Fingerprint=([A-F0-9:]+)/i);
  const thumbprint = match ? match[1].replace(/:/g, '') : '';

  console.log('\n✅ Certificado generado:');
  console.log('   Thumbprint:', thumbprint);
  console.log('   Archivos en:', certsDir);
  console.log('\nPara importar en Windows Store (PowerShell):');
  console.log(`powershell -Command "& { $pwd = ConvertTo-SecureString -String '${password}' -Force -AsPlainText; Import-PfxCertificate -FilePath '${pfxPath}' -CertStoreLocation Cert:\\CurrentUser\\My -Password $pwd }"`);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
