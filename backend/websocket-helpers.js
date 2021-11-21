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
  const firstByte = buffer.readUInt8(0);
  const isFinalFrame = Boolean((firstByte >>> 7) & 0x1);
  const [reserved1, reserved2, reserved3] = [
    Boolean((firstByte >>> 6) & 0x1),
    Boolean((firstByte >>> 5) & 0x1),
    Boolean((firstByte >>> 4) & 0x1),
  ];
  const opCode = firstByte & 0xF;

  if (opCode === 0x8) return null;

  if (opCode !== 0x1) return;

  const secondByte = buffer.readUInt8(1);
  const isMasked = Boolean((secondByte >>> 7) & 0x1);
  let currentOffset = 2;
  let payloadLength = secondByte & 0x7F;
  if (payloadLength > 125) {
    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(currentOffset);
      currentOffset += 2;
    } else { // 127
      const leftPart = buffer.readUInt32BE(currentOffset);
      const rightPath = buffer.readUInt32BE(currentOffset += 4);

      throw new Error('Large payloads not currently implemented'); 
    }
  }

  let maskingKey;
  if (isMasked) {
    maskingKey = buffer.readUInt32BE(currentOffset);
    currentOffset += 4;
  }

  const data = Buffer.alloc(payloadLength);

  if (isMasked) {
    for (let i = 0, j = 0; i < payloadLength; ++i, j = i % 4) {
      const shift = j == 3 ? 0 : (3 - j) << 3;
      const mask = (shift == 0 ? maskingKey : (maskingKey >>> shift)) & 0xFF;
      const source = buffer.readUInt8(currentOffset++); 
      data.writeUInt8(mask ^ source, i);
    }
  } else {
    buffer.copy(data, 0, currentOffset++);
  }

  const json = data.toString('utf8');
  
  return JSON.parse(json);
}

const generateAcceptValue = (acceptKey) => {
  return crypto
    .createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

module.exports = { parseMessage, constructReply, generateAcceptValue }