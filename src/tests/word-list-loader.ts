import { readFileSync } from "fs";
import { join } from "path";
import { TernaryStringSet } from "..";

let text = readFileSync(join(__dirname, "short-english-list.txt"), "utf8");

/** Immutable short list of English words. */
export const words = Object.freeze(text.split("\n"));

const sourceTree = new TernaryStringSet(words);

/** Creates a new set containing the word list. Pass false if you will not mutate the set. */
export function wordSet(mutable = true): TernaryStringSet {
  return mutable ? new TernaryStringSet(sourceTree) : sourceTree;
}

text = null; // allow GC of the source text
