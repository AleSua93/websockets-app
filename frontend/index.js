const ws = new WebSocket('ws://localhost:8000', 'json');

ws.addEventListener('open', () => {
  console.log('Connection open!');
});