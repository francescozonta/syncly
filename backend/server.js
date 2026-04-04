require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createTables } = require('./db/schema');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Realtime: ogni utente entra nella room del suo progetto
io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => socket.join(projectId));

  socket.on('idea-added', (data) => socket.to(data.projectId).emit('idea-added', data));
  socket.on('idea-voted', (data) => socket.to(data.projectId).emit('idea-voted', data));
  socket.on('task-updated', (data) => socket.to(data.projectId).emit('task-updated', data));
});

const PORT = process.env.PORT || 4000;

createTables().then(() => {
  server.listen(PORT, () => console.log(`🚀 Syncly backend su porta ${PORT}`));
});
