# Encrypted Cloud Storage

Welcome to your very own **Encrypted Cloud Storage**!

This is a simple, secure, and friendly file storage application built with Flask. It keeps your files safe with AES-GCM encryption and requires a password + TOTP 2FA verification to decrypt and access anything.

## Features

- **Encryption Magic**: Everything you upload is encrypted before it hits the disk. Even if someone gets access to your server, they see nothing.
- **Password Protection**: Set a master password to unlock your vault.
- **Two-Factor Auth (2FA)**: Add an extra layer of security with TOTP
- **File Management**: Upload, view, and delete files with ease. Images and videos can be previewed directly in your browser!
- **Storage Limits**: Keep track of your usage with a handy progress bar.

## Setup

1.  **Install Requirements**:
    Make sure you have Python installed, then grab the dependencies:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure**:
    The app looks for a `.env` file in the `config/` folder for secrets.
    - Create `config/.env` and add:
      ```
      FLASK_SECRET_KEY=your-super-secret-key-here
      ```
    - Check out `config/config.toml` if you want to tweak storage limits or sessions.

3.  **Run it!**:
    ```bash
    python app.py
    ```
    Open your browser and head to `http://127.0.0.1:5000`.

## Usage

- **First Run**:
    - You'll be asked to set a **Master Password**. make it a good one!
    - Optionally, scan the QR code to set up 2FA.
- **Unlock**: Enter your password (and 2FA code if set) to access your files.
- **Upload**: Drag and drop or select files to encryption-upload them.
- **Enjoy**: Sleep soundly knowing your data is safe!

---

Made with <3
& built in a private repo first, moved all files to this public repo then :)