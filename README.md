# E2EE Cloud Webserver

This project is a self-hosted Flask app for storing files with client-side encryption.
Files are encrypted in the browser before upload (AES-256-GCM), and decrypted in the browser on download/preview.
The server stores ciphertext blobs plus vault metadata.

## What It Does

- Uses a master password and TOTP 2FA (authenticator app) for access.
- Encrypts file payloads client-side before upload.
- Supports multi-file upload with a visible queue and progress.
- Shows storage usage and enforces upload/storage limits.
- Lets you search, filter, sort, rename, download, and delete files.
- Generates image thumbnails client-side and caches them in IndexedDB for faster reloads.
- Supports list/grid view and theme selection (saved in `localStorage`).

## Security Model

- Passwords are not sent as plaintext. The browser sends a SHA-256 hash (`hpw`) to authenticate.
- File contents are encrypted client-side with AES-GCM using a key derived from the password hash (PBKDF2-SHA256, 600,000 iterations).
- Server-side session stores the password hash to allow metadata operations while unlocked.
- TOTP secret is encrypted at rest in `auth.json`.
- Basic hardening headers are set (`Cache-Control`, `X-Frame-Options`, `X-Content-Type-Options`, CSP, optional HSTS).
- Rate limits are applied to setup/login/upload routes.

This project has no formal security audit. Use HTTPS and standard server hardening in production.

## Requirements

- Python 3.10+
- `pip`

## Quick Start

1. Install dependencies:

```bash
pip install -r config/requirements.txt
```

2. Create environment file:

```bash
cp config/.env.example config/.env
```

3. Set a strong `FLASK_SECRET_KEY` in `config/.env`.

You can generate one with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

4. Run the app:

```bash
python app.py
```

5. Open:

```text
http://127.0.0.1:5000
```

## First-Run Setup Flow

1. Set your vault password.
2. Additionally set:
   - max upload size (MB)
   - max total storage (MB)
   - session timeout (hours)
3. Scan the TOTP QR code with your authenticator app.
4. Enter the 6-digit TOTP code to complete setup.

## Configuration

### `config/.env` (common)

- `FLASK_SECRET_KEY` (required)
- `SERVER_PORT` (default: `5000`)

### Advanced values

Advanced values are read from process environment at startup (`MAX_UPLOAD_MB`, `MAX_STORAGE_MB`, `PBKDF2_ITERATIONS`, `SESSION_HOURS`, `SECURE_COOKIES`, `ENCRYPT_METADATA`, `TOTP_VALID_WINDOW`, `STORAGE_DIR`).

`ENCRYPT_METADATA=1` (default) stores metadata in encrypted `metadata.enc`. With `ENCRYPT_METADATA=0`, metadata is stored in plaintext `metadata.json`, but filenames are still individually encrypted.

After initial setup, UI-selected limits/session settings are persisted in `<storage_dir>/config.json`.

## Data Stored on Disk

Default storage directory is `storage/`.

- `storage/auth.json`: password verifier, salt, encrypted TOTP secret
- `storage/metadata.enc` or `storage/metadata.json`: vault metadata
- `storage/<file_id>.bin`: encrypted file blobs
- `storage/sessions/`: Flask session files
- `storage/config.json`: custom limits/session values from setup UI

## Main Routes

- `GET /` vault UI (requires unlocked session)
- `GET/POST /login`
- `GET/POST /setup`
- `POST /logout`
- `GET /api/files`
- `POST /upload`
- `GET /files/<file_id>`
- `DELETE /files/<file_id>`
- `PUT /files/<file_id>/rename`

## Development Status

Active roadmap items are tracked in [`TODO.md`](TODO.md).
