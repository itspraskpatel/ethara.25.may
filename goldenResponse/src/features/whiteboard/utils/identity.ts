const adjectives = ['spark', 'moon', 'pixel', 'mango', 'echo', 'cloud', 'lime', 'nova', 'river', 'orbit'];
const nouns = ['fox', 'panda', 'otter', 'kite', 'comet', 'lantern', 'moth', 'whale', 'raven', 'tiger'];

function randomToken(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, length);
}

export function createBoardSlug() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}-${noun}-${randomToken(10)}`;
}

export function createBrowserId() {
  return `browser_${randomToken(24)}`;
}
