// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Leer el puerto desde las variables de entorno o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta simple para probar
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando 🚀' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
