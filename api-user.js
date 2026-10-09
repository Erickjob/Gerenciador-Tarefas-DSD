const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const SECRET_KEY = "chave_secreta_faculdade";

app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Informe o username" });

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  return res.json({ token, user: username });
});

app.listen(3001, () => console.log("Serviço de Usuários rodando na porta 3001"));