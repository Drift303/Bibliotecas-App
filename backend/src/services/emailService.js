const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

const GMAIL_HOST = 'smtp.gmail.com';
const GMAIL_PORT = 465;

// Timeouts explícitos: sin esto, un fallo de conexión/autenticación con Gmail
// puede quedarse colgado mucho tiempo (SMTP no siempre falla rápido). Si eso
// pasa dentro de un loop como remindAllDueToday, la petición completa puede
// superar el timeout del proxy (p. ej. Railway) antes de que Express alcance
// a responder — el navegador entonces reporta un error de "CORS" genérico,
// aunque el problema real es que la respuesta nunca llegó a tiempo.
const TRANSPORT_TIMEOUTS = {
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
};

// --- IPv4 forzado a nivel de socket, no de "opciones que nodemailer podría
// o no respetar" ---
//
// Railway no tiene salida IPv6 funcional: smtp.gmail.com resuelve tanto a
// IPv4 como a IPv6, y cuando le toca IPv6 la conexión falla con
// "ENETUNREACH ...:465" o se cuelga.
//
// Ya se probaron dos formas "declarativas" de forzar IPv4 (`family: 4` y un
// `lookup` personalizado pasados como opciones a nodemailer.createTransport)
// y NINGUNA de las dos tuvo efecto en producción — nodemailer/smtp-connection
// no las está usando para resolver la conexión real, así que confiar en esas
// opciones fue un callejón sin salida.
//
// La única forma 100% infalible es resolver la IP nosotros mismos ANTES de
// crear la conexión, usando dns.resolve4 (que por definición SOLO devuelve
// registros A / IPv4, nunca puede devolver una IPv6), y pasarle esa IP
// literal a nodemailer como `host`. Una conexión TCP a una IP literal no
// puede "convertirse" en IPv6 por sí sola.
//
// Como nos conectamos por IP y no por nombre, el certificado TLS de Gmail
// (emitido para "smtp.gmail.com") no coincidiría con la IP durante el
// handshake — por eso se fija `tls.servername` al hostname real, para que la
// validación del certificado se siga haciendo contra el nombre correcto
// (esto es el equivalente a fijar el SNI manualmente).
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

  console.log(`[emailService] Transporter Gmail inicializado, conectando por IP fija: ${host} (servername=${GMAIL_HOST})`);

  return nodemailer.createTransport({
    host,
    port: GMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      servername: GMAIL_HOST,
    },
    ...TRANSPORT_TIMEOUTS,
  });
}

// El transporter se resuelve una sola vez (se cachea la promesa) para no
// hacer una consulta DNS en cada correo. Si un envío falla, se invalida el
// cache para que el siguiente intento vuelva a resolver la IP desde cero
// (por si la IP que teníamos cacheada dejó de responder — Gmail balancea
// tráfico entre varias IPs).
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

    // Agregar adjunto si viene la imagen en base64
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
