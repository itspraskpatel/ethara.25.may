const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  let activeUsers = 0;

  io.on('connection', (socket) => {
    activeUsers++;
    io.emit('userCount', activeUsers);

    socket.on('join-board', (boardId) => {
      socket.join(boardId);
    });

    socket.on('draw-event', (data) => {
      socket.to(data.boardId).emit('draw-event', data);
    });

    socket.on('disconnect', () => {
      activeUsers--;
      io.emit('userCount', activeUsers);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});