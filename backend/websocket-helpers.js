const crypto = require('crypto');

function constructReply(data) {
  // Convert the data to JSON and copy it into a buffer
  const json = JSON.stringify(data)
  const jsonByteLength = Buffer.byteLength(json);
  // Note: we're not supporting > 65535 byte payloads at this stage 
  const lengthByteCount = jsonByteLength < 126 ? 0 : 2; 
  const payloadLength = lengthByteCount === 0 ? jsonByteLength : 126; 
  const buffer = Buffer.alloc(2 + lengthByteCount + jsonByteLength); 
  // Write out the first byte, using opcode `1` to indicate that the message 
  // payload contains text data 
  buffer.writeUInt8(0b10000001, 0); 
  buffer.writeUInt8(payloadLength, 1); 
  // Write the length of the JSON payload to the second byte 
  let payloadOffset = 2; 
  if (lengthByteCount > 0) { 
    buffer.writeUInt16BE(jsonByteLength, 2); payloadOffset += lengthByteCount; 
  } 
  // Write the JSON data to the data buffer 
  buffer.write(json, payloadOffset); 
  return buffer;
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

module.exports = { parseMessage, constructReply, calculateWebSocketAcceptHeader }