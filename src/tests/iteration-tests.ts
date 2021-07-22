import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let set: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  set = new TernaryStringSet();
});

test("Symbol.iterator does nothing on empty set", () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let i = 0;
  for (const s of set) {
    ++i;
  }
  expect(i).toBe(0);
});

test("Symbol.iterator visits each word", () => {
  set.addAll(words);
  let i = 0;
  for (const s of set) {
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
  set.addAll(words);
  expect([...set]).toEqual(words);
  expect(iteratorToArray(set.keys())).toEqual(words);
  expect(iteratorToArray(set.values())).toEqual(words);
  expect(set.values()).toEqual(set.keys());
});

test("entries() returns [string, string] doubled values", () => {
  expect(iteratorToArray(set.entries())).toEqual([]);

  const words = ["alpha", "beta", "delta", "epsilon", "gamma"];
  set.addAll(words);
  expect(iteratorToArray(set.entries())).toEqual(words.map((s) => [s, s]));
});

test("forEach() passes string, string doubled values", () => {
  const words = ["alpha", "beta", "delta", "epsilon", "gamma"];
  const result: string[] = [];
  set.addAll(words);
  set.forEach((k, v, t) => {
    expect(t).toBe(set);
    expect(v).toBe(k);
    result.push(k);
  });
  expect(result).toEqual(words);
});

test("forEach() callback called with thisArg", () => {
  set.add("ostrich");
  const thisArg = "fish";
  set.forEach(function (this: string, k, v, t) {
    expect(t).toBe(set);
    expect(k).toBe("ostrich");
    expect(v).toBe(k);
    expect(this).toBe(thisArg);
  }, thisArg);
});
