# Encrypted Cloud Storage (E2EE)

Welcome to your very own **Encrypted Cloud Storage**!

This is a simple & secure file storage application built with Python Flask.
It uses **true end-to-end encryption** — your files are encrypted in the browser before they ever leave your device, using AES-256-GCM. The server only stores opaque encrypted blobs and never sees your plaintext data. Access is protected by a master password + TOTP 2FA.

I started this project because I wanted to have a simple & secure file storage application that I could use to store my files anywhere I want — even on servers I don't fully trust. You can host it like me on a VPS or even in a container.
Make sure you connect a domain that offers HTTPS (SSL) for your server.

## Features

- **End-to-End Encryption**: All files are encrypted in your browser using AES-256-GCM before upload. The server never sees unencrypted data — it only stores opaque blobs. Even with full server access, your files remain unreadable.
- **Zero-Knowledge Architecture**: Your password never leaves the browser. A SHA-256 hash is used to derive encryption keys client-side via PBKDF2 (600k iterations). The server cannot decrypt anything.
- **Password Protection**: Set a master password to unlock and view your vault.
- **Two-Factor Auth (2FA)**: Add an extra layer of security with TOTP.
- **File Management**: Upload, edit, and delete files with ease. Image thumbnails are decrypted and rendered directly in your browser.
- **Storage Limits**: Keep track of your usage with a handy progress bar.

## Setup

1.  **Install Requirements**:
    Make sure you have Python installed, then grab the dependencies:
    ```bash
    pip install -r "config/requirements.txt"
    ```

2.  **Configure**:
    The app looks for a `.env` file in the `config/` folder.
    - Copy `config/.env.example` to `config/.env`:
      ```bash
      cp config/.env.example config/.env
      ```
    - Open `config/.env` and set `FLASK_SECRET_KEY`.
    - You can also tweak storage limits variables there.

3.  **Run it!**:
    ```bash
    python app.py
    ```
    Open your browser and head to `http://127.0.0.1:5000` if hosted locally.
    If you host it in a container, remove the SERVER_PORT from the .env file.
    The code will then automatically detect the port.

## Usage

- **First Run**:
    - You'll be asked to set a **Master Password** and configure your **Storage Limits**.
    - Optionally, scan the QR code to set up 2FA.
- **Unlock**: Enter your password and 2FA code to access your files.
- **Upload**: Drag and drop or select files — they are encrypted locally in your browser before being sent to the server.
- **Enjoy**: Edit, download, and delete your files with ease. Everything is decrypted client-side — safe & encrypted! ^^

---

Made with <3