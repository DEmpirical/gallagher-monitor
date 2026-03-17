# Skill: generate-certificate

Genera un certificado TLS autofirmado (con clave privada) y opcionalmente lo importa en Windows Store. Útil para pruebas o para crear certificados cliente para APIs como Gallagher.

## Use Cases

- Necesitas un certificado cliente con private key para autenticación mutua TLS
- Quieres generar rápidamente un certificado para desarrollo
- Necesitas importar el certificado en Windows Store para que win-ca lo encuentre

## What it does

- Genera clave privada RSA (2048 bits)
- Crea un CSR con CN, O, C
- Autofirma el certificado (válido por 2 años)
- Empaqueta en PFX (PKCS#12) con contraseña
- Importa en Windows Store (Current User → Personal) si corre en Windows
- Devuelve thumbprint, rutas de archivos y estado

## How to invoke

```json
{
  "skill": "generate-certificate",
  "input": {
    "commonName": "CommandCentreClient",
    "organization": "Redhood",
    "country": "US",
    "password": "MiPassword123",
    "importToStore": true
  }
}
```

### Parameters

- `commonName` (string): Nombre común del certificado (ej: "CommandCentreClient")
- `organization` (string): Organización (default: "Redhood")
- `country` (string): País (2 letras, default: "US")
- `password` (string): Contraseña del PFX (default: "MiPassword123")
- `importToStore` (boolean): Si true, importa en Windows Store (solo Windows). Default: true.

## Output

```json
{
  "success": true,
  "thumbprint": "A1B2C3D4...",
  "files": {
    "key": "/ruta/a/client.key",
    "crt": "/ruta/a/client.crt",
    "pfx": "/ruta/a/client.pfx"
  },
  "imported": true,
  "message": "Certificado generado e importado en Windows Store"
}
```

## Dependencies

- Requires `openssl` in PATH (usually present in OpenClaw environment or can be installed).
- Windows import requires PowerShell.

## Example

Generar certificado e importar:

```bash
openclaw skills run generate-certificate --input '{"commonName":"CommandCentreClient","organization":"Redhood","country":"US"}'
```

Luego usar el thumbprint en `GALLAGHER_CLIENT_CERT_THUMBPRINT`.

## Notes

- Los archivos se guardan en `certs/` relativo al directorio de trabajo actual (workspace).
- El thumbprint es SHA1 del certificado en formato hexadecimal (sin espacios).
- Si ya existe un certificado con el mismo CN en el store, puede fallar o importar duplicado.
