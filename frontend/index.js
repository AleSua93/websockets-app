const ws = new WebSocket('ws://localhost:8000', 'json');

ws.addEventListener('open', () => {
  console.log('Connection open!');

  ws.send(JSON.stringify({ message: "Hello from the client!" }));
});


ws.addEventListener('message', (message) => {
  const jsonObj = JSON.parse(message.data);

  console.log(jsonObj.message);
})