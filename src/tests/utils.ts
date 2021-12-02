import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { TernaryStringSet } from "..";

let text = readFileSync(join(__dirname, "short-english-list.txt"), "utf8");

/** Immutable short list of English words. */
export const words = Object.freeze(text.split("\n"));

const sourceTree = new TernaryStringSet(words);
sourceTree.balance();

/**
 * Creates a new set containing the word list.
 * To get a shared instance, pass false to indicate that you will
 * **not** mutate the set.
 */
export function wordSet(mutable = true): TernaryStringSet {
  return mutable ? new TernaryStringSet(sourceTree) : sourceTree;
}

text = null; // allow GC of the source text

/** Writes a set into the test directory for use in future tests. */
export function writeBuffer(set: TernaryStringSet, filename: string): void {
  const buff = Buffer.from(set.toBuffer());
  const file = join(__dirname, filename + ".bin");
  writeFileSync(file, buff);
}

/** Reads a set from the test directory. */
export function readBuffer(filename: string): ArrayBuffer {
  const file = join(__dirname, filename + ".bin");
  return readFileSync(file).buffer;
}

/** Shuffles an array into random order. */
export function shuffle<T>(array: T[]): T[] {
  let i = array.length,
    toSwap;
  while (i > 0) {
    toSwap = Math.floor(Math.random() * i);
    const temp = array[--i];
    array[i] = array[toSwap];
    array[toSwap] = temp;
  }
  return array;
}

/** Tests set equality with an informative `expect()` for each member.  */
export function expectSameSet(
  lhs: TernaryStringSet,
  rhs: TernaryStringSet,
  checkCompact = false,
): void {
  expect(rhs.size).toBe(lhs.size);
  expect(rhs.has("")).toBe(rhs.has(""));
  for (const word of lhs) {
    expect(`${word}: ${rhs.has(word)}`).toBe(`${word}: true`);
  }
  if (checkCompact) {
    expect(rhs.compacted).toBe(lhs.compacted);
  }
}
