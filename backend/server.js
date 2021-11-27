const http = require('http');
const static = require('node-static');
const { parseMessage, constructResponse, calculateWebSocketAcceptHeader } = require('./websocket-helpers');

const file = new static.Server('../frontend');
const port = 8000;

const server = http.createServer((req, res) => {
  req.addListener('end', () => file.serve(req, res)).resume();
});

server.on('upgrade', (req, socket) => {
  if (req.headers['upgrade'] !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request');
    return;
  }

  const acceptKey = req.headers['sec-websocket-key'];
  const hash = calculateWebSocketAcceptHeader(acceptKey);

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Connection: Upgrade',
    'Upgrade: WebSocket',
    `Sec-WebSocket-Accept: ${hash}`,
    'Sec-WebSocket-Protocol: json'
  ].join('\r\n') + '\r\n\r\n');

  socket.on('data', buffer => {
    const data = parseMessage(buffer);

    if (data) {
      console.log(`Message received: ${data.message}`);

      const response = constructResponse({ message: 'Hello from the server!' })
      socket.write(response);
    } else if (data === null) {
      console.log('WebSocket connection closed by the client');
    }
  })
});

server.listen(port, () => console.log(`Server running at http://localhost:${port}`));