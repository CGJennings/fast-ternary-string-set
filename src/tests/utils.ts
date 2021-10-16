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
 * Pass false if you will **not** mutate the set to get a shared instance.
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

/** Simple set equality test that does not rely on `equals()`. */
export function sameSet(lhs: TernaryStringSet, rhs: TernaryStringSet): boolean {
  if (lhs.size !== rhs.size) return false;
  let eq = true;
  const a = Array.from(lhs),
    b = Array.from(rhs);
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      eq = false;
      break;
    }
  }
  return eq;
}