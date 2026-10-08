const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve o Cliente Web Frontend

const SECRET_KEY = "chave_secreta_faculdade";

// Middleware de Autenticação JWT
function verifyJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = decoded;
    next();
  });
}

// Documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Redirecionamento 1: Autenticação -> API Users (3001)
app.post('/api/login', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();

    // HATEOAS na resposta de Login
    if (data.token) {
      data._links = {
        self: { href: "/api/login", method: "POST" },
        get_todos: { href: "/api/todos", method: "GET", title: "Listar Tarefas (Requer JWT)" }
      };
    }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao comunicar com API de Usuários" });
  }
});

// Redirecionamento 2: Listar Tarefas -> API Todos (3002) - Protegido por JWT + HATEOAS
app.get('/api/todos', verifyJWT, async (req, res) => {
  try {
    const response = await fetch('http://localhost:3002/todos');
    const todos = await response.json();

    // Aplicação do conceito de HATEOAS na resposta
    const responseWithHateoas = {
      data: todos,
      _links: {
        self: { href: "/api/todos", method: "GET" },
        create_todo: { href: "/api/todos", method: "POST", title: "Criar Nova Tarefa" }
      }
    };

    res.json(responseWithHateoas);
  } catch (err) {
    res.status(500).json({ error: "Erro ao comunicar com API de Tarefas" });
  }
});

// Redirecionamento 3: Criar Tarefa -> API Todos (3002) - Protegido por JWT
app.post('/api/todos', verifyJWT, async (req, res) => {
  try {
    const response = await fetch('http://localhost:3002/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    
    // HATEOAS no recurso criado
    data._links = {
      self: { href: "/api/todos", method: "POST" },
      list_all: { href: "/api/todos", method: "GET" }
    };

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

app.listen(3000, () => {
  console.log("API Gateway rodando em http://localhost:3000");
  console.log("Documentação Swagger disponível em http://localhost:3000/docs");
});