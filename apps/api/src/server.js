require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = require('./app');

// ⚠️ importa el index del folder routes
const routes = require('./routes');


// Middlewares base
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Sanity checks
app.get('/ping', (_req, res) => res.json({ pong: true }));    // http://localhost:8080/ping
app.get('/api/health', (_req, res) => res.json({ ok: true })); // http://localhost:8080/api/health

// ⛳ monta todo el router con prefijo /api
app.use('/api', routes);

// (debug opcional para ver qué llega)
app.use((req, _res, next) => { console.log('[REQ]', req.method, req.url); next(); });

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

module.exports = app;
