let ws;

const openConnection = () => {
  ws = new WebSocket('ws://localhost:8000', 'json');
  
  ws.addEventListener('error', (err) => {
    document.getElementById('connection-result-text').textContent = `
      The connection couldn't be established
    `;
    document.getElementById('connection-result-text').style.visibility = "visible";
    document.getElementById('connection-result-text').style.color = "red";
  });

  ws.addEventListener('open', () => {
    document.getElementById('connection-result-text').textContent = "Connection opened!";
    document.getElementById('connection-result-text').style.visibility = "visible";
    document.getElementById('connection-result-text').style.color = "green";

    document.getElementById('connection-unavailable-text').style.visibility = "hidden";
  });

  ws.addEventListener('message', (message) => {
    const messageObj = JSON.parse(message.data);
    document.getElementById('received-message').textContent = messageObj.message;
  });
}

const sendMessage = () => {
  const message = document.getElementById('message-input').value;
  const messageObj = JSON.stringify({ message });

  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
  if (ws && ws.readyState === 1) {
    ws.send(messageObj);
  } else {
    document.getElementById('connection-unavailable-text').style.visibility = "visible";
  }
}