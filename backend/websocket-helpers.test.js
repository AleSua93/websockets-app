const { expect } = require('@jest/globals');
const { parseMessage } = require('./websocket-helpers');
const { Buffer } = require('buffer');

describe("Helper functions", () => {
  test('Single-frame JSON messages should be parsed and reconstructed correctly', () => {
    const originalMessage = { message: 'Hello from the client!' };

    // This buffer represents a WS frame with the contents { message: 'Hello from the client!' }
    const buf = Buffer.from([
      0x81, 0xa4, 0x51, 0x87, 0x71, 0x9b, 0x2a, 0xa5, 0x1c, 0xfe, 0x22, 0xf4, 0x10, 0xfc,
      0x34, 0xa5, 0x4b, 0xb9, 0x19, 0xe2, 0x1d, 0xf7, 0x3e, 0xa7, 0x17, 0xe9, 0x3e, 0xea,
      0x51, 0xef, 0x39, 0xe2, 0x51, 0xf8, 0x3d, 0xee, 0x14, 0xf5, 0x25, 0xa6, 0x53, 0xe6
    ]);

    const parsedMessage = parseMessage(buf);

    expect(parsedMessage).toEqual(originalMessage);
  })

  test('Multi-frame JSON messages should be parsed and reconstructed correctly', () => {
    // TODO
  })
})