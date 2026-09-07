import compression from 'compression';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import multer from 'multer';
import sharp from 'sharp';

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const required = (name) => String(process.env[name] || '').trim();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProduction ? '1h' : 0 }));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: isProduction ? '30d' : 0, immutable: isProduction }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many estimate requests from this address. Please try again shortly or call us.' }
});

function clean(value, maximum) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function verifyTurnstile(token, remoteip) {
  const secret = required('TURNSTILE_SECRET_KEY');
  if (!secret && !isProduction) return true;
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: remoteip || '' });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(10_000) });
  const result = response.ok && await response.json();
  if (!result?.success) return false;
  const origin = required('SITE_ORIGIN');
  return !origin || result.hostname === new URL(origin).hostname;
}

app.get('/api/site-config', (_request, response) => {
  response.set('Cache-Control', 'public, max-age=3600');
  response.json({ turnstileSiteKey: required('TURNSTILE_SITE_KEY') });
});

app.post('/api/contact', contactLimiter, upload.array('images', 3), async (request, response) => {
  const name = clean(request.body.name, 100);
  const email = clean(request.body.email, 254);
  const phone = clean(request.body.phone, 40);
  const address = clean(request.body.address, 500);
  const project = clean(request.body.project, 80);
  const message = clean(request.body.message, 4000);
  const website = clean(request.body.website, 200);

  if (website) return response.status(204).end(); // Honeypot: silently discard bots.
  if (!name || !validEmail(email) || !phone || !message) {
    return response.status(400).json({ error: 'Please include your name, email, phone number, and a brief project description.' });
  }
  try {
    if (!(await verifyTurnstile(request.body.turnstileToken, request.ip))) {
      return response.status(400).json({ error: 'Please complete the security check and try again.' });
    }
  } catch {
    return response.status(503).json({ error: 'The security check is temporarily unavailable. Please call us instead.' });
  }

  const apiKey = required('RESEND_API_KEY');
  const to = required('CONTACT_TO_EMAIL');
  const from = required('CONTACT_FROM_EMAIL');
  if (!apiKey || !to || !from) {
    return response.status(503).json({ error: 'Online estimates are not configured yet. Please call us at 859-475-6976.' });
  }

  const details = [
    ['Name', name], ['Email', email], ['Phone', phone], ['Address', address || 'Not provided'], ['Project type', project || 'Not specified'], ['Project details', message]
  ].map(([label, value]) => `<p><strong>${label}:</strong><br>${escapeHtml(value)}</p>`).join('');

  const attachments = [];
  if (request.files && request.files.length > 0) {
    for (let i = 0; i < request.files.length; i++) {
      const file = request.files[i];
      try {
        const compressedBuffer = await sharp(file.buffer)
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
          
        attachments.push({
          filename: `image-${i + 1}-${Date.now()}.jpg`,
          content: compressedBuffer
        });
      } catch (err) {
        console.error('Failed to compress image', err);
      }
    }
  }

  try {
    await new Resend(apiKey).emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `New estimate request from ${name}`,
      html: `<h1>New estimate request</h1>${details}`,
      text: `New estimate request\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address || 'Not provided'}\nProject type: ${project || 'Not specified'}\n\nProject details:\n${message}`,
      attachments: attachments.length > 0 ? attachments : undefined
    });
    console.log(`[SUCCESS] Contact email sent from ${name} (${email}) with ${attachments.length} attachment(s).`);
    response.status(202).json({ ok: true });
  } catch (error) {
    console.error('Contact email failed', error);
    response.status(503).json({ error: 'We could not send your request just now. Please call us at 859-475-6976.' });
  }
});

app.get('/about', (_request, response) => response.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/gallery', (_request, response) => response.sendFile(path.join(__dirname, 'public', 'gallery.html')));

app.get('/{*splat}', (_request, response) => response.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(port, () => console.log(`Hunt Home Improvements is ready on port ${port}`));
