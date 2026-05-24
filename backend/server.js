require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend estático
app.use(express.static(path.join(__dirname, '..')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pesos', require('./routes/pesos'));
app.use('/api/pressoes', require('./routes/pressoes'));
app.use('/api/diario', require('./routes/diario'));
app.use('/api/dieta', require('./routes/dieta'));
app.use('/api/treinos', require('./routes/treinos'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
