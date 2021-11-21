const ws = new WebSocket('ws://localhost:8000', 'json');

ws.addEventListener('open', () => {
  console.log('Connection open!');

  const data = { message: 'Hello from the client!' }
  const json = JSON.stringify(data);
  ws.send(json);
});

ws.addEventListener('message', event => {
  console.log('Message received!');
  const data = JSON.parse(event.data);
  console.log(data);
});