import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("Symbol.iterator does nothing on empty set", () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let i = 0;
  for (const s of tree) {
    ++i;
  }
  expect(i).toBe(0);
});

test("Symbol.iterator visits each word", () => {
  tree.addAll(words);
  let i = 0;
  for (const s of tree) {
    expect(s).toBe(words[i++]);
  }
  expect(i).toBe(words.length);
});

function iteratorToArray<T>(it: Iterator<T>): T[] {
  const array: T[] = [];
  let next = it.next();
  while (!next.done) {
    array[array.length] = next.value;
    next = it.next();
  }
  return array;
}

test("keys(), values(), and Symbol.iterator are equivalent", () => {
  const words = ["alpha", "beta", "delta", "epsilon", "gamma"];
  tree.addAll(words);
  expect([...tree]).toEqual(words);
  expect(iteratorToArray(tree.keys())).toEqual(words);
  expect(iteratorToArray(tree.values())).toEqual(words);
});

test("entries() returns [string, string] doubled values", () => {
  expect(iteratorToArray(tree.entries())).toEqual([]);

  const words = ["alpha", "beta", "delta", "epsilon", "gamma"];
  tree.addAll(words);
  expect(iteratorToArray(tree.entries())).toEqual(words.map((s) => [s, s]));
});

test("forEach() passes string, string doubled values", () => {
  const words = ["alpha", "beta", "delta", "epsilon", "gamma"];
  const result: string[] = [];
  tree.addAll(words);
  tree.forEach((k, v, t) => {
    expect(t).toBe(tree);
    expect(v).toBe(k);
    result.push(k);
  });
  expect(result).toEqual(words);
});

test("forEach() callback called with thisArg", () => {
  tree.add("ostrich");
  const thisArg = "fish";
  tree.forEach(function (this: string, k, v, t) {
    expect(t).toBe(tree);
    expect(k).toBe("ostrich");
    expect(v).toBe(k);
    expect(this).toBe(thisArg);
  }, thisArg);
});
