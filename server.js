const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'senha123';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

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

app.get('/agendamentos', (req, res) => {
  db.all('SELECT * FROM agendamentos ORDER BY data, horario', (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

app.get('/horarios-disponiveis', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).send({ erro: 'Data não fornecida' });

  const horariosPadrao = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  db.all('SELECT horario FROM agendamentos WHERE data = ?', [data], (err, rows) => {
    if (err) return res.status(500).send(err);
    const ocupados = rows.map(r => r.horario);
    const disponiveis = horariosPadrao.filter(h => !ocupados.includes(h));
    res.json(disponiveis);
  });
});

app.post('/agendar', (req, res) => {
  const { nome, data, horario } = req.body;

  db.get('SELECT COUNT(*) as total FROM agendamentos WHERE data = ? AND horario = ?', [data, horario], (err, row) => {
    if (err) return res.status(500).send({ erro: 'Erro ao verificar duplicação' });
    if (row.total > 0) return res.status(400).send({ erro: 'Horário já agendado.' });

    db.run('INSERT INTO agendamentos (nome, data, horario) VALUES (?, ?, ?)', [nome, data, horario], function (err) {
      if (err) return res.status(500).send({ erro: 'Erro ao agendar' });
      res.status(201).json({ id: this.lastID });
    });
  });
});

app.delete('/cancelar/:id', (req, res) => {
  const senha = req.headers['x-admin-password'];
  if (senha !== ADMIN_PASSWORD) {
    return res.status(403).send({ erro: 'Senha incorreta. Cancelamento não autorizado.' });
  }

  const { id } = req.params;
  db.run('DELETE FROM agendamentos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).send({ erro: 'Erro ao cancelar' });
    res.sendStatus(200);
  });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
