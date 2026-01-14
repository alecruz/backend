// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Ruta simple para probar el backend
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando 🚀' });
});

// ✅ Ruta para probar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as now');
    res.json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    console.error('Error probando la DB:', error);
    res.status(500).json({ ok: false, error: 'Error probando la base de datos' });
  }
});

// ✅ Ruta para ver si DATABASE_URL está llegando (debug)
app.get('/debug-env', (req, res) => {
  res.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlStartsWith: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.slice(0, 20) + '...'
      : null,
  });
});

// 🔐 Ruta de REGISTRO de usuario
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // Verificar si el email ya existe
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar el nuevo usuario
    await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [email, passwordHash]
    );

    return res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error('Error en /register:', error);
    return res.status(500).json({ error: 'Error interno en el registro' });
  }
});

// 🔐 Ruta de LOGIN de usuario
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // Buscar el usuario por email
    const result = await db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // No hay usuario con ese email
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Comparar la contraseña ingresada con el hash guardado
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar un token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'dev_secret', // toma la variable de entorno o un valor por defecto en local
      {
        expiresIn: '1h', // el token dura 1 hora
      }
    );

    return res.json({
      message: 'Login exitoso',
      token,
    });
  } catch (error) {
    console.error('Error en /login:', error);
    return res.status(500).json({ error: 'Error interno en el login' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
