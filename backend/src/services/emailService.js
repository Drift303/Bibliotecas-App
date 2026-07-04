const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendTempPasswordEmail = async ({ name, email, tempPassword }) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: 'Biblioteca Inteligente',
        email: 'fangroux80@gmail.com', 
      },
      to: [{ email }],
      subject: 'Tu acceso a Biblioteca Inteligente',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1E3A5F;">Bienvenido/a, ${name}</h2>
          <p>El bibliotecario de tu institución te ha dado de alta en el sistema de Biblioteca Inteligente.</p>
          <p>Aquí están tus credenciales de acceso:</p>
          <div style="background: #F7FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Correo:</strong> ${email}</p>
            <p style="margin: 8px 0 0;"><strong>Contraseña temporal:</strong> 
              <span style="font-family: monospace; font-size: 18px; color: #1E3A5F; font-weight: bold;">${tempPassword}</span>
            </p>
          </div>
          <p style="color: #C53030; font-size: 13px;">⚠️ Guarda esta contraseña, no se volverá a enviar.</p>
          <p style="color: #718096; font-size: 12px;">Si no esperabas este correo, ignóralo.</p>
        </div>
      `,
    });

    return { success: true, data: result };
  } catch (err) {
    console.error('Brevo error:', err.message);
    return { success: false, error: err };
  }
};

module.exports = { sendTempPasswordEmail };