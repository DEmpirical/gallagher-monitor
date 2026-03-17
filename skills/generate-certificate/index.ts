import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface Input {
  commonName?: string;
  organization?: string;
  country?: string;
  password?: string;
  importToStore?: boolean;
}

interface Output {
  success: boolean;
  thumbprint?: string;
  files?: {
    key: string;
    crt: string;
    pfx: string;
  };
  imported?: boolean;
  error?: string;
}

/**
 * Skill: generate-certificate
 * Genera un certificado cliente con private key usando OpenSSL.
 * Opcionalmente importa en Windows Store via PowerShell.
 */
export async function run(input: Input): Promise<Output> {
  const cn = input.commonName || 'CommandCentreClient';
  const org = input.organization || 'Redhood';
  const c = input.country || 'US';
  const password = input.password || 'MiPassword123';
  const importToStore = input.importToStore !== false;

  const certsDir = path.resolve(process.cwd(), 'certs');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const keyPath = path.join(certsDir, 'client.key');
  const csrPath = path.join(certsDir, 'client.csr');
  const crtPath = path.join(certsDir, 'client.crt');
  const pfxPath = path.join(certsDir, 'client.pfx');

  try {
    // Verificar openssl
    try {
      await execAsync('openssl version');
    } catch {
      return { success: false, error: 'OpenSSL no está instalado o no está en el PATH. Instala OpenSSL.' };
    }

    // Generar clave privada
    await execAsync(`openssl genrsa -out "${keyPath}" 2048`);

    // Generar CSR
    const subject = `/CN=${cn}/O=${org}/C=${c}`;
    await execAsync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "${subject}"`);

    // Autofirmar certificado (2 años)
    await execAsync(`openssl x509 -req -days 730 -in "${csrPath}" -signkey "${keyPath}" -out "${crtPath}"`);

    // Crear PFX
    await execAsync(`openssl pkcs12 -export -out "${pfxPath}" -inkey "${keyPath}" -in "${crtPath}" -passout pass:${password}`);

    // Obtener thumbprint (SHA1)
    const { stdout } = await execAsync(`openssl x509 -fingerprint -sha1 -noout -in "${crtPath}"`);
    const match = stdout.match(/SHA1 Fingerprint=([A-F0-9:]+)/i);
    const thumbprint = match ? match[1].replace(/:/g, '') : '';

    // Importar en Windows Store si es Windows
    let imported = false;
    if (importToStore && process.platform === 'win32') {
      try {
        const pfxBase64 = fs.readFileSync(pfxPath).toString('base64');
        const psScript = `
$pwd = ConvertTo-SecureString -String "${password}" -Force -AsPlainText
$pfxBytes = [Convert]::FromBase64String("${pfxBase64}")
$pfxPath = "${pfxPath.replace(/\\/g, '\\')}"
[System.IO.File]::WriteAllBytes($pfxPath, $pfxBytes)
Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\CurrentUser\My -Password $pwd
        `.trim();
        const psPath = path.join(certsDir, 'import.ps1');
        fs.writeFileSync(psPath, psScript, 'utf8');
        await execAsync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { windowsHide: true });
        imported = true;
      } catch (e: any) {
        console.warn('Failed to import to Windows Store:', e.message);
      }
    }

    return {
      success: true,
      thumbprint,
      files: {
        key: keyPath,
        crt: crtPath,
        pfx: pfxPath,
      },
      imported,
      message: imported ? 'Certificado generado e importado en Windows Store' : 'Certificado generado',
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'Error generando certificado',
    };
  }
}
