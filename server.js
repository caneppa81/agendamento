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

  // Verificar se já existe agendamento para esse dia e horário
  const sqlCheck = `SELECT COUNT(*) as total FROM agendamentos WHERE data = ? AND horario = ?`;
  db.get(sqlCheck, [data, horario], (err, row) => {
    if (err) return res.status(500).send({ erro: 'Erro ao verificar duplicação' });

    if (row.total > 0) {
      return res.status(400).send({ erro: 'Já existe um agendamento nesse horário.' });
    }

    // Se não existir, salvar o agendamento
    const sqlInsert = `INSERT INTO agendamentos (nome, data, horario) VALUES (?, ?, ?)`;
    db.run(sqlInsert, [nome, data, horario], function (err) {
      if (err) return res.status(500).send({ erro: 'Erro ao agendar' });
      res.status(201).json({ id: this.lastID });
    });
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

