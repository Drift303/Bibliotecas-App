const nodemailer = require('nodemailer');

// Configuración de transporte usando Gmail.
// Timeouts explícitos: sin esto, un fallo de conexión/autenticación con Gmail
// puede quedarse colgado mucho tiempo (SMTP no siempre falla rápido). Si eso
// pasa dentro de un loop como remindAllDueToday, la petición completa puede
// superar el timeout del proxy (p. ej. Railway) antes de que Express alcance
// a responder — el navegador entonces reporta un error de "CORS" genérico,
// aunque el problema real es que la respuesta nunca llegó a tiempo.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10_000, // tiempo máx. para conectar al servidor SMTP
  greetingTimeout: 10_000,   // tiempo máx. esperando el saludo del servidor
  socketTimeout: 15_000,     // tiempo máx. de inactividad en el socket
});

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

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('Nodemailer error:', err.message);
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

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('Nodemailer error:', err.message);
    return { success: false, error: err };
  }
};

module.exports = { sendTempPasswordEmail, sendLoanDueReminderEmail };