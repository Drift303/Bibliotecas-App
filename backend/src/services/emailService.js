const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

// --- Gmail SMTP directo por el puerto 587 (STARTTLS) ---
//
// Historial de intentos anteriores, para que quede documentado por qué el
// código se ve así:
//   1. Brevo (API HTTPS): funcionaba a nivel de transporte, pero Gmail
//      descartaba el correo en silencio porque el remitente (@gmail.com) no
//      es un dominio que Brevo pueda autenticar (no es tuyo) — se ve como
//      suplantación aunque técnicamente no viole DMARC en modo "none".
//   2. SMTP directo a smtp.gmail.com puerto 465 (TLS implícito): fallaba
//      primero con ENETUNREACH (Railway sin salida IPv6 funcional), y tras
//      forzar IPv4 manualmente, fallaba con "Connection timeout" — Railway
//      bloquea las conexiones salientes al puerto 465.
//
// Ahora se prueba el puerto 587 (STARTTLS) en vez de 465 (TLS implícito).
// Algunas plataformas bloquean 465 pero dejan pasar 587, o viceversa. Si
// esto funciona, es la mejor solución posible: el correo sale realmente
// desde la infraestructura de Google, así que no hay problema de
// suplantación/DKIM como con Brevo.
//
// Se mantiene la resolución manual de IPv4 (por la lección aprendida con
// ENETUNREACH) como medida de seguridad adicional.

const GMAIL_HOST = 'smtp.gmail.com';
const GMAIL_PORT = 587;

const TRANSPORT_TIMEOUTS = {
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
};

let cachedTransporterPromise = null;

async function buildTransporter() {
  let host = GMAIL_HOST;
  try {
    const addresses = await resolve4(GMAIL_HOST);
    if (addresses && addresses.length > 0) {
      host = addresses[0];
    }
  } catch (err) {
    console.error('[emailService] No se pudo resolver IPv4 de smtp.gmail.com, se intentará con el hostname directo:', err.message);
  }

  console.log(`[emailService] Transporter Gmail (SMTP:587/STARTTLS) inicializado, conectando por IP fija: ${host} (servername=${GMAIL_HOST})`);

  return nodemailer.createTransport({
    host,
    port: GMAIL_PORT,
    secure: false,      // 587 usa STARTTLS, no TLS implícito
    requireTLS: true,   // rechaza el envío si el STARTTLS no se pudo negociar
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // DEBE ser una App Password de Gmail (16 caracteres), no la contraseña normal
    },
    tls: {
      // Nos conectamos por IP, no por nombre — hay que fijar el servername
      // para que el handshake TLS valide el certificado contra el nombre
      // correcto en vez de contra la IP literal.
      servername: GMAIL_HOST,
    },
    ...TRANSPORT_TIMEOUTS,
  });
}

// El transporter se resuelve una sola vez (se cachea la promesa). Si un
// envío falla, se invalida el cache para que el siguiente intento vuelva a
// resolver la IP y reconstruir la conexión desde cero.
function getTransporter() {
  if (!cachedTransporterPromise) {
    cachedTransporterPromise = buildTransporter();
  }
  return cachedTransporterPromise;
}

function invalidateTransporterCache() {
  cachedTransporterPromise = null;
}

const sendTempPasswordEmail = async ({ name, email, tempPassword, credentialImage }) => {
  try {
    const mailOptions = {
      from: `"Biblioteca Inteligente" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Tu acceso y credencial de Biblioteca Inteligente',
      html: `
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
      `,
    };

    if (credentialImage) {
      const base64Data = credentialImage.split(';base64,').pop();
      mailOptions.attachments = [
        {
          filename: `Credencial_${name.replace(/\s+/g, '_')}.png`,
          content: base64Data,
          encoding: 'base64',
        },
      ];
    }

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('Nodemailer error:', err.message);
    invalidateTransporterCache();
    return { success: false, error: err };
  }
};

const sendLoanDueReminderEmail = async ({ name, email, bookTitle, dueDate }) => {
  try {
    const mailOptions = {
      from: `"Biblioteca Inteligente" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recordatorio de Préstamo Vencido',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1E3A5F;">Hola, ${name}</h2>
          <p>Te recordamos que tienes un préstamo vencido en la biblioteca.</p>
          <div style="background: #F7FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Libro:</strong> ${bookTitle}</p>
            <p style="margin: 8px 0 0;"><strong>Fecha de Vencimiento:</strong> ${new Date(dueDate).toLocaleDateString('es-MX')}</p>
          </div>
          <p>Por favor, devuelve el libro a la brevedad para evitar multas adicionales.</p>
        </div>
      `,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('Nodemailer error:', err.message);
    invalidateTransporterCache();
    return { success: false, error: err };
  }
};

module.exports = { sendTempPasswordEmail, sendLoanDueReminderEmail };
