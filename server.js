const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Banco de dados
const db = new sqlite3.Database('./agendamentos.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Rotas
app.get('/agendamentos', (req, res) => {
  db.all('SELECT * FROM agendamentos ORDER BY data, horario', (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

app.post('/agendar', (req, res) => {
  const { nome, data, horario } = req.body;
  db.run('INSERT INTO agendamentos (nome, data, horario) VALUES (?, ?, ?)', [nome, data, horario], function (err) {
    if (err) return res.status(500).send(err);
    res.json({ id: this.lastID });
  });
});

app.delete('/cancelar/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM agendamentos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

