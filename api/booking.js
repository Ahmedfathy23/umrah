const { sql } = require('@vercel/postgres');

async function ensureTable() {
  await sql`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      arrival DATE,
      notes TEXT,
      receipt_file_name TEXT,
      receipt_file_size INT,
      receipt_url TEXT,
      received_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await ensureTable();
    // Expect JSON body from frontend
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data', (c) => chunks.push(c));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const raw = Buffer.concat(chunks).toString('utf8') || '{}';
    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      return res.status(400).json({ error: 'Please send JSON with Content-Type: application/json' });
    }

    const {
      name = null,
      phone = null,
      email = null,
      arrival = null,
      notes = null,
      receipt_file_name = null,
      receipt_file_size = null,
      receipt_url = null
    } = body || {};

    const result = await sql`
      INSERT INTO bookings (name, phone, email, arrival, notes, receipt_file_name, receipt_file_size, receipt_url)
      VALUES (${name}, ${phone}, ${email}, ${arrival}, ${notes}, ${receipt_file_name}, ${receipt_file_size}, ${receipt_url})
      RETURNING id
    `;

    return res.status(200).json({ ok: true, bookingId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to save booking.' });
  }
};
