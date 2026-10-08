const express = require('express');
const app = express();
app.use(express.json());

let todos = [
  { id: 1, title: "Estudar para a apresentação", done: false },
  { id: 2, title: "Entregar o trabalho", done: true }
];

app.get('/todos', (req, res) => res.json(todos));

app.post('/todos', (req, res) => {
  const { title } = req.body;
  const newTodo = { id: todos.length + 1, title, done: false };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.listen(3002, () => console.log("Serviço de Tarefas rodando na porta 3002"));