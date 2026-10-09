const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SECRET_KEY = "chave_secreta_faculdade";

function verifyJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Token JWT não fornecido" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido ou expirado" });
    req.user = decoded;
    next();
  });
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Login -> Redireciona para API 3001
app.post('/api/login', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();

    if (data.token) {
      data._links = {
        self: { href: "/api/login", method: "POST" },
        get_todos: { href: "/api/todos", method: "GET", title: "Listar Tarefas" },
        create_todo: { href: "/api/todos", method: "POST", title: "Criar Tarefa" }
      };
    }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro na comunicação com a API de Usuários" });
  }
});

// Listar Tarefas -> API 3002 (Com HATEOAS)
app.get('/api/todos', verifyJWT, async (req, res) => {
  try {
    const response = await fetch('http://localhost:3002/todos');
    const todos = await response.json();

    const responseWithHateoas = {
      data: todos,
      _links: {
        self: { href: "/api/todos", method: "GET" },
        create_todo: { href: "/api/todos", method: "POST", title: "Cadastrar Nova Tarefa" }
      }
    };

    res.json(responseWithHateoas);
  } catch (err) {
    res.status(500).json({ error: "Erro na comunicação com a API de Tarefas" });
  }
});

// Criar Tarefa -> API 3002 (Com HATEOAS)
app.post('/api/todos', verifyJWT, async (req, res) => {
  try {
    const response = await fetch('http://localhost:3002/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();

    data._links = {
      self: { href: "/api/todos", method: "POST" },
      list_all: { href: "/api/todos", method: "GET", title: "Ver Lista Atualizada" }
    };

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log("API Gateway rodando na porta 3000");
  console.log("Swagger: http://localhost:3000/docs");
});