const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function createUlid(date = new Date()): string {
  let time = date.getTime();
  let timePart = '';

  for (let index = 0; index < 10; index += 1) {
    timePart = ENCODING[time % 32] + timePart;
    time = Math.floor(time / 32);
  }

  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);

  let randomPart = '';
  for (let index = 0; index < 16; index += 1) {
    randomPart += ENCODING[bytes[index % bytes.length] % 32];
  }

  return `${timePart}${randomPart}`;
}
