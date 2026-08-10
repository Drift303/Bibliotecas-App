const { BrevoClient } = require('@getbrevo/brevo');

// --- Por qué Brevo (API HTTPS) y no SMTP directo (nodemailer + Gmail) ---
//
// Se intentó mandar los correos por SMTP directo a smtp.gmail.com (puertos
// 465/587) desde nodemailer. En Railway esas conexiones fallaban siempre:
// primero con ENETUNREACH (el contenedor no tiene salida IPv6 funcional, y
// Gmail resuelve tanto a IPv4 como IPv6), y después de forzar IPv4 a mano
// (resolviendo la IP nosotros mismos y conectando por IP directa), el
// resultado fue "Connection timeout" — es decir, Railway bloquea de plano
// las conexiones salientes a los puertos SMTP (25/465/587), algo común en
// plataformas PaaS como medida antispam.
//
// La solución real es dejar de usar SMTP y mandar los correos por una API
// HTTPS (puerto 443, nunca bloqueado). BREVO_API_KEY y la dependencia
// @getbrevo/brevo ya estaban en el proyecto (ver .env.example) pero nunca se
// conectaron al código — esto termina esa migración.
const BREVO_SENDER = {
  name: 'Biblioteca Inteligente',
  // Debe ser un remitente verificado/autorizado en tu cuenta de Brevo
  // (Brevo → Senders, Domains & Dedicated IPs). Si EMAIL_USER no está
  // verificado ahí, Brevo rechazará el envío.
  email: process.env.EMAIL_USER,
};

let cachedClient = null;
function getBrevoClient() {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY no está configurada');
  }
  if (!cachedClient) {
    cachedClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  }
  return cachedClient;
}

const sendTempPasswordEmail = async ({ name, email, tempPassword, credentialImage }) => {
  try {
    const brevo = getBrevoClient();

    const payload = {
      subject: 'Tu acceso y credencial de Biblioteca Inteligente',
      htmlContent: `
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
      sender: BREVO_SENDER,
      to: [{ email, name }],
    };

    // Agregar adjunto si viene la imagen en base64
    if (credentialImage) {
      const base64Data = credentialImage.split(';base64,').pop();
      payload.attachment = [
        {
          name: `Credencial_${name.replace(/\s+/g, '_')}.png`,
          content: base64Data,
        },
      ];
    }

    const info = await brevo.transactionalEmails.sendTransacEmail(payload);
    return { success: true, data: info };
  } catch (err) {
    console.error('Brevo error:', err?.body || err.message || err);
    return { success: false, error: err };
  }
};

const sendLoanDueReminderEmail = async ({ name, email, bookTitle, dueDate }) => {
  try {
    const brevo = getBrevoClient();

    const info = await brevo.transactionalEmails.sendTransacEmail({
      subject: 'Recordatorio de Préstamo Vencido',
      htmlContent: `
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
      sender: BREVO_SENDER,
      to: [{ email, name }],
    });
    return { success: true, data: info };
  } catch (err) {
    console.error('Brevo error:', err?.body || err.message || err);
    return { success: false, error: err };
  }
};

module.exports = { sendTempPasswordEmail, sendLoanDueReminderEmail };
