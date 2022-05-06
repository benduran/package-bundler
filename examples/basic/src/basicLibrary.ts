import randomize from 'randomatic';

/** Gets a max number between 0 and the parameter (inclusive) */
export function getRandomNumber(max: number) {
  return Math.floor(Math.random() * max);
}

/**
 * Pads a string with empty characters using the native `String.prototype.padStart` function
 */
export function leftPad(input: string, padSize: number): string {
  return input.padStart(padSize);
}

export function leftPadRedux(input: string, padSize: number): string {
  if (!padSize) return input;
  return ` ${leftPadRedux(input, padSize - 1)}`;
}

export function getRandomStrings(count: number) {
  return new Array(count).map(() => randomize('abcdefghijklmnopqrstuvwxyz'));
}
