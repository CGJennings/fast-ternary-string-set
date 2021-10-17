import { TernaryStringSet } from "../index";
import { words, wordSet } from "./utils";

let set: TernaryStringSet;

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
  set = wordSet(false);
  let i = 0;
  for (const s of set) {
    expect(s).toBe(words[i++]);
  }
  expect(i).toBe(words.length);
});

test("iterator includes empty string if present", () => {
  expect([...set]).toEqual([]);
  set.add("");
  expect([...set]).toEqual([""]);
  set.add("sturgeon");
  expect([...set]).toEqual(["", "sturgeon"]);
});

test("toArray() and Array.from() are equivalent", () => {
  expect(set.toArray()).toEqual(Array.from(set));
  set.add("");
  expect(set.toArray()).toEqual(Array.from(set));
  set = wordSet(false);
  expect(set.toArray()).toEqual(Array.from(set));
});

test("keys(), values(), and Symbol.iterator are equivalent", () => {
  const words = ["", "alpha", "beta", "delta", "epsilon", "gamma"];
  set.addAll(words);
  expect([...set]).toEqual(words);
  expect(Array.from(set.keys())).toEqual(words);
  expect(Array.from(set.values())).toEqual(words);
  expect(set.values()).toEqual(set.keys());
});

test("entries() returns [string, string] doubled values", () => {
  expect(Array.from(set.entries())).toEqual([]);

  const words = ["", "alpha", "beta", "delta", "epsilon", "gamma"];
  set.addAll(words);
  expect(Array.from(set.entries())).toEqual(words.map((s) => [s, s]));
});

test("forEach() passes string, string doubled values", () => {
  const words = ["", "alpha", "beta", "delta", "epsilon", "gamma"];
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
