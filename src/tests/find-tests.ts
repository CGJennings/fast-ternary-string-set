import { TernaryStringSet } from "../index";
import { wordSet, words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

function find(
  set: string[],
  expected: string,
  predicate: (value: string, index: number, set: TernaryStringSet) => boolean,
  thisArg?: unknown,
): void {
  const tst = new TernaryStringSet(set);
  expect(tst.toArray()).toEqual(set);
  tst.find((s, i, t) => {
    expect(t.has(s)).toBe(true);
    expect(t).toBe(tst);
    expect(s).toBe(set[i]);
    return false;
  });

  const result = tst.find(predicate, thisArg);
  expect(result).toBe(expected);
}

test("find() throws if passed non-function", () => {
  expect(() => set.find(null)).toThrow();
  expect(() => set.find(1 as unknown as (s: string) => boolean)).toThrow();
  expect(() => set.find({} as unknown as (s: string) => boolean)).toThrow();
});

test("find() with empty set is undefined", () => {
  expect(set.find(() => true)).toBeUndefined();
});

test("find() with empty string", () => {
  find([""], "", () => true);
  find([""], "", (s) => s === "");
  find([""], undefined, (s) => s === "alpaca");
  find(["", "iguana"], "", () => true);
  find(["", "iguana"], "", (s) => s === "");
  find(["", "iguana"], undefined, (s) => s === "alpaca");
});

test("find() with singleton", () => {
  find(["snail"], "snail", (s) => s === "snail");
  find(["snail"], undefined, (s) => s === "moth");
  find(["snail"], undefined, (s) => s === "");
});

test("find() with multiple elements", () => {
  find(["leopard", "lion", "lynx"], "lynx", (s) => s === "lynx");
  find(["leopard", "lion", "lynx"], "leopard", (s) => s.startsWith("l"));
  find(["leopard", "lion", "lynx"], "lion", (s) => s.endsWith("n"));
  find(["leopard", "lion", "lynx"], undefined, (s) => s === "");
});

test("find() against word list", () => {
  expect(wordSet(false).find((s) => s.length > 0)).toBe(words[0]);
  expect(wordSet(false).find((s) => s.endsWith("ing"))).not.toBeUndefined();
  expect(wordSet(false).find((s) => s.endsWith("zzz"))).toBeUndefined();
});

test("find() predicate called with thisArg", () => {
  const thisArg: unknown = "shrew";
  function callback(this: unknown) {
    return this === thisArg;
  }
  find([""], "", callback, thisArg);
});
