const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Permite procesar JSON en el cuerpo de las peticiones

// Inicializar el cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta de prueba para verificar que el backend funciona
app.get('/', (req, res) => {
    res.json({ status: "Backend de la Biblioteca en línea" });
    });

    /**
     * RUTA DE LOGIN
      * Espera un JSON con { "email": "...", "password": "..." }
       */
       app.post('/api/login', async (req, res) => {
           const { email, password } = req.body;

               // Validación básica de entrada
                   if (!email || !password) {
                           return res.status(400).json({ 
                                       success: false, 
                                                   error: 'El correo y la contraseña son obligatorios.' 
                                                           });
                                                               }

                                                                   try {
                                                                           // Llamada a la API de autenticación interna de Supabase (auth.users)
                                                                                   const { data, error } = await supabase.auth.signInWithPassword({
                                                                                               email: email,
                                                                                                           password: password,
                                                                                                                   });

                                                                                                                           // Si Supabase devuelve un error (credenciales incorrectas, etc.)
                                                                                                                                   if (error) {
                                                                                                                                               return res.status(401).json({ 
                                                                                                                                                               success: false, 
                                                                                                                                                                               error: error.message 
                                                                                                                                                                                           });
                                                                                                                                                                                                   }

                                                                                                                                                                                                           // Login exitoso: Retorna la sesión y los datos del usuario
                                                                                                                                                                                                                   // El 'access_token' dentro de session servirá para futuras peticiones protegidas
                                                                                                                                                                                                                           return res.status(200).json({
                                                                                                                                                                                                                                       success: true,
                                                                                                                                                                                                                                                   message: 'Login inicializado correctamente',
                                                                                                                                                                                                                                                               session: data.session,
                                                                                                                                                                                                                                                                           user: data.user
                                                                                                                                                                                                                                                                                   });

                                                                                                                                                                                                                                                                                       } catch (err) {
                                                                                                                                                                                                                                                                                               console.error(err);
                                                                                                                                                                                                                                                                                                       return res.status(500).json({ 
                                                                                                                                                                                                                                                                                                                   success: false, 
                                                                                                                                                                                                                                                                                                                               error: 'Error interno del servidor.' 
                                                                                                                                                                                                                                                                                                                                       });
                                                                                                                                                                                                                                                                                                                                           }
                                                                                                                                                                                                                                                                                                                                           });

                                                                                                                                                                                                                                                                                                                                           // Iniciar el servidor
                                                                                                                                                                                                                                                                                                                                           app.listen(PORT, () => {
                                                                                                                                                                                                                                                                                                                                               console.log(`Servidor corriendo en: http://localhost:${PORT}`);
                                                                                                                                                                                                                                                                                                                                               });
                                                                                                                                                                                                                                                                                                                                               