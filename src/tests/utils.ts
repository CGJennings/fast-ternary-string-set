import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { TernaryStringSet } from "..";

let text = readFileSync(join(__dirname, "short-english-list.txt"), "utf8");

/** Immutable short list of English words. */
export const words = Object.freeze(text.split("\n"));

const sourceTree = new TernaryStringSet(words);
sourceTree.balance();

/** Creates a new set containing the word list. Pass false if you will not mutate the set. */
export function wordSet(mutable = true): TernaryStringSet {
  return mutable ? new TernaryStringSet(sourceTree) : sourceTree;
}

text = null; // allow GC of the source text

/** Write a set into the test directory for use in future tests. */
export function writeBuffer(set: TernaryStringSet, filename: string): void {
  const buff = Buffer.from(set.toBuffer());
  const file = join(__dirname, filename + ".bin");
  writeFileSync(file, buff);
}

/** Read a set from the test directory. */
export function readBuffer(filename: string): ArrayBuffer {
  const file = join(__dirname, filename + ".bin");
  return readFileSync(file).buffer;
}

// let z = wordSet();
// z.compact();
// writeBuffer(z, "version3");
