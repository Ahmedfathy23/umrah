// api/upload.js - Upload receipt file to Vercel Blob
const Busboy = require('busboy');
const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
  }

  try {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let fileName = null;
    let fileSize = 0;

    await new Promise((resolve, reject) => {
      busboy.on('file', (name, file, info) => {
        fileName = info.filename || 'upload.bin';
        const chunks = [];
        file.on('data', (d) => {
          chunks.push(d);
          fileSize += d.length;
        });
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });
      busboy.on('error', reject);
      busboy.on('finish', resolve);
      req.pipe(busboy);
    });

    if (!fileBuffer || !fileName) {
      return res.status(400).json({ error: 'No file received' });
    }

    // Upload to Vercel Blob (public)
    const blob = await put(fileName, fileBuffer, { access: 'public' });

    return res.status(200).json({
      ok: true,
      url: blob.url,
      fileName,
      fileSize
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
