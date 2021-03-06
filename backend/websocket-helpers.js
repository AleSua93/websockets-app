const crypto = require('crypto');

function constructResponse(data) {
  const payload = JSON.stringify(data);
  let payloadLength = Buffer.byteLength(payload, 'utf-8');
  // If our payload is small, we don't need extra bytes to store the length
  let extraLengthBytes = 0

  let updatedPayloadLength;
  if (payloadLength > 125) {
    if (payloadLength < 65536) {
      updatedPayloadLength = payloadLength;
      payloadLength = 126
      extraLengthBytes = 2
    } else {
      updatedPayloadLength = payloadLength;
      payloadLength = 127
      extraLengthBytes = 8
    }
  }

  // 2 byte header + additional payload length bytes + payload
  const responseLength =  2 + extraLengthBytes + (updatedPayloadLength ?? payloadLength)
  const responseBuffer = Buffer.alloc(responseLength)

  //Variable to track bytes written
  let currentBytesOffset = 0

  responseBuffer.writeUInt8(0b10000001, currentBytesOffset)
  currentBytesOffset++;
  responseBuffer.writeUInt8(payloadLength, currentBytesOffset)
  currentBytesOffset++;

  if (payloadLength === 126) {
    responseBuffer.writeUInt16BE(updatedPayloadLength, currentBytesOffset)
    currentBytesOffset += 2
  }

  responseBuffer.write(payload, currentBytesOffset)

  return responseBuffer
}

function parseMessage(buffer) {
  //Variable to track bytes read
  let currentBytesOffset = 0;

  // Read first two bytes
  const firstBytes = buffer.readUint16BE();

  const isFinalFrame = firstBytes >>> 15 & 0x1;
  const [rsv1, rsv2, rsv3] = [
    firstBytes >>> 14 & 0x1,
    firstBytes >>> 13 & 0x1,
    firstBytes >>> 12 & 0x1,
  ];
  const opCode = (firstBytes >>> 8) & 0xF;

  if (opCode !== 0x1) return null;

  const isMasked = (firstBytes >>> 7) & 0x1;
  let payloadLength = firstBytes & 0x7F;

  currentBytesOffset += 2;

  if (payloadLength > 125) {
    if (payloadLength === 126) {
      payloadLength = buffer.readUint16BE(currentBytesOffset);
      currentBytesOffset += 2;
    } else { // 127
      payloadLength = buffer.readUintBE(2, 8);
      currentBytesOffset += 8;
    }
  }

  let maskingKey;
  if (isMasked) {
    maskingKey = buffer.readUInt32BE(currentBytesOffset);
    currentBytesOffset += 4;
  }

  const extensionData = 0; // Set this as 0 for now
  const applicationData = Buffer.alloc(payloadLength);

  if (isMasked) {
    for (
      let i = 0, j = 0;
      i < payloadLength;
      ++i, j = i % 4
    ) {
      const shift = j === 3 ? 0 : (3 - j) << 3;
      const maskingKeyOctet = (shift === 0 ? maskingKey : (maskingKey >>> shift)) & 0xFF;

      const transformedOctet = buffer.readUInt8(currentBytesOffset);
      currentBytesOffset++;
 
      applicationData.writeUInt8(maskingKeyOctet ^ transformedOctet, i);
    }
  } else {
    buffer.copy(applicationData, 0, currentBytesOffset++);
  }

  return JSON.parse(applicationData.toString('utf8'));
}

const calculateWebSocketAcceptHeader = (acceptKey) => {
  return crypto
    .createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

module.exports = { parseMessage, constructResponse, calculateWebSocketAcceptHeader }