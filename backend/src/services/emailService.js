// --- Envío de correo vía Gmail API (OAuth2), no SMTP ---
//
// Historial de intentos anteriores (para que quede documentado por qué el
// código se ve así):
//   1. Brevo (API HTTPS): el transporte funcionaba, pero Gmail descartaba el
//      correo en silencio porque el remitente (@gmail.com) no es un dominio
//      que Brevo pueda autenticar (no es tuyo) — se ve como suplantación.
//   2. SMTP directo a smtp.gmail.com por los puertos 465 y 587: ambos fallan
//      con timeout — Railway bloquea las conexiones salientes a puertos SMTP
//      por completo (medida antispam común en plataformas PaaS).
//
// La solución que sí resuelve ambos problemas a la vez es usar la API REST
// de Gmail (HTTPS, puerto 443 — nunca bloqueado) autenticada con OAuth2 bajo
// la cuenta real de Gmail. Como el correo sale genuinamente desde la
// infraestructura de Google bajo esa cuenta, no hay problema de
// suplantación/DKIM como con Brevo.
//
// Variables de entorno requeridas:
//   EMAIL_USER            -> la cuenta de Gmail remitente (debe ser la misma
//                             cuenta con la que se autorizó el OAuth2)
//   GOOGLE_CLIENT_ID       -> Client ID de las credenciales OAuth2 (tipo "Aplicación web")
//   GOOGLE_CLIENT_SECRET   -> Client Secret de esas mismas credenciales
//   GOOGLE_REFRESH_TOKEN   -> Refresh token generado una vez vía OAuth Playground
//                             (con la pantalla de consentimiento en modo "Producción",
//                             para que no expire a los 7 días)

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0; // epoch ms

async function getAccessToken() {
  const now = Date.now();
  // Reutiliza el access token mientras no esté por vencer (margen de 60s).
  if (cachedAccessToken && now < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`No se pudo refrescar el access token de Google: ${data.error_description || data.error || res.status}`);
  }

  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function encodeHeaderUtf8(text) {
  // RFC 2047: los headers de un correo deben ser ASCII, así que el Subject
  // (que lleva acentos/ñ) se codifica en base64 con la sintaxis =?UTF-8?B?...?=
  return `=?UTF-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`;
}

// Construye el mensaje RFC 2822 crudo (con o sin adjunto) y lo devuelve ya
// codificado en base64url, formato que exige la API de Gmail.
function buildRawMessage({ from, to, subject, html, attachment }) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: "Biblioteca Inteligente" <${from}>`,
    `To: ${to}`,
    `Subject: ${encodeHeaderUtf8(subject)}`,
    'MIME-Version: 1.0',
  ];

  let body;
  if (attachment) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html, 'utf-8').toString('base64'),
      '',
      `--${boundary}`,
      `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename}"`,
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      attachment.base64Content,
      '',
      `--${boundary}--`,
    ].join('\r\n');
  } else {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    headers.push('Content-Transfer-Encoding: base64');
    body = Buffer.from(html, 'utf-8').toString('base64');
  }

  const raw = `${headers.join('\r\n')}\r\n\r\n${body}`;
  return toBase64Url(Buffer.from(raw, 'utf-8'));
}

async function sendViaGmailApi({ to, subject, html, attachment }) {
  const accessToken = await getAccessToken();
  const raw = buildRawMessage({ from: process.env.EMAIL_USER, to, subject, html, attachment });

  const res = await fetch(SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gmail API error: ${data.error?.message || res.status}`);
  }
  return data;
}

const sendTempPasswordEmail = async ({ name, email, tempPassword, credentialImage }) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1E3A5F;">Bienvenido/a, ${name}</h2>
        <p>Has sido registrado en el sistema de Biblioteca Inteligente.</p>
        <p>Aquí están tus credenciales de acceso para entrar a la plataforma:</p>
        <div style="background: #F7FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Correo:</strong> ${email}</p>
          <p style="margin: 8px 0 0;"><strong>Contraseña temporal:</strong> 
            <span style="font-family: monospace; font-size: 18px; color: #1E3A5F; font-weight: bold;">${tempPassword}</span>
          </p>
        </div>
        <p>Hemos adjuntado tu credencial de estudiante. Puedes imprimirla o llevarla en tu celular para agilizar tus préstamos.</p>
        <p style="color: #C53030; font-size: 13px;">⚠️ Guarda esta contraseña, no se volverá a enviar.</p>
      </div>
    `;

    let attachment;
    if (credentialImage) {
      attachment = {
        filename: `Credencial_${name.replace(/\s+/g, '_')}.png`,
        contentType: 'image/png',
        base64Content: credentialImage.split(';base64,').pop(),
      };
    }

    const info = await sendViaGmailApi({ to: email, subject: 'Tu acceso y credencial de Biblioteca Inteligente', html, attachment });
    return { success: true, data: info };
  } catch (err) {
    console.error('Gmail API error:', err.message);
    return { success: false, error: err };
  }
};

const sendLoanDueReminderEmail = async ({ name, email, bookTitle, dueDate }) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1E3A5F;">Hola, ${name}</h2>
        <p>Te recordamos que tienes un préstamo vencido en la biblioteca.</p>
        <div style="background: #F7FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Libro:</strong> ${bookTitle}</p>
          <p style="margin: 8px 0 0;"><strong>Fecha de Vencimiento:</strong> ${new Date(dueDate).toLocaleDateString('es-MX')}</p>
        </div>
        <p>Por favor, devuelve el libro a la brevedad para evitar multas adicionales.</p>
      </div>
    `;

    const info = await sendViaGmailApi({ to: email, subject: 'Recordatorio de Préstamo Vencido', html });
    return { success: true, data: info };
  } catch (err) {
    console.error('Gmail API error:', err.message);
    return { success: false, error: err };
  }
};

module.exports = { sendTempPasswordEmail, sendLoanDueReminderEmail };
