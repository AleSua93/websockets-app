// Results in a 25 bytes long payload (stringified in a JSON)
const shortMessage = `Hello there`;
// Results in a 221 bytes long payload (stringified in a JSON)
const mediumMessage = `
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  Praesent tincidunt dignissim aliquam. Quisque cursus porttitor interdum.
  Fusce mi nunc, hendrerit vitae porttitor interdum, tempus vel ex.
`;

module.exports = {
  shortMessage, mediumMessage
}