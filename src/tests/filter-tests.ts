import { TernaryStringSet } from "../index";
import { wordSet, words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

/** Tests that result is identical to `Array.filter`, requires sorted input. */
function filter(
  str: readonly string[],
  predicate: (s: string, i: number) => boolean,
  thisArg?: unknown,
) {
  expect(
    new TernaryStringSet(str).filter(predicate, thisArg).toArray(),
  ).toEqual(str.filter(predicate, thisArg));
}

test("filter() throws if passed non-function", () => {
  expect(() => set.filter(null)).toThrow();
  expect(() => set.filter(1 as unknown as (s: string) => boolean)).toThrow();
  expect(() => set.filter({} as unknown as (s: string) => boolean)).toThrow();
});

test("filter() empty set", () => {
  expect(set.filter(() => true).size).toBe(0);
  expect(wordSet(false).filter(() => false).size).toBe(0);
});

test("filter() empty string", () => {
  set.add("");
  expect(set.filter((s) => s === "").size).toBe(1);
  expect(set.filter((s) => s === "").has("")).toBeTruthy();
  expect(set.filter((s) => s !== "").size).toBe(0);
  expect(set.filter((s) => s !== "").has("")).toBeFalsy();
});

test("filter() simple sets", () => {
  let str = ["ant", "bear", "cat", "dog", "elephant"];
  filter(str, (s) => s.length === 3);
  filter(str, (s) => s.length !== 3);
  filter(str, () => true);
  filter(str, () => false);

  str = ["", "owl", "rhino"];
  filter(str, (s) => s.length === 3);
  filter(str, (s) => s.length !== 3);
  filter(str, () => true);
  filter(str, () => false);
});

test("filter() word list", () => {
  expect(words.length).toBeGreaterThan(0);
  filter(words, (s) => s.startsWith("e"));
  filter(words, (s) => s.includes("e"));
  filter(words, (s) => s.length === 3);
  filter(words, (s) => s.length !== 3);
  filter(words, () => true);
  filter(words, () => false);
});

test("filter() index parameter", () => {
  let str: string[];
  const indexPredicate = (s: string, i: number) => s === str[i];

  str = [];
  filter(str, indexPredicate);

  str = ["", "ant", "bass"];
  filter(str, indexPredicate);

  str = ["ant", "bass", "coyote", "duck", "raccoon"];
  filter(str, indexPredicate);
});

test("filter() callback called with thisArg", () => {
  const thisArg: unknown = {};
  function callback(this: unknown) {
    return this === thisArg;
  }
  filter(["", "aphid", "crow", "walrus"], callback, thisArg);
});
