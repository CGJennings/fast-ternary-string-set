import { TernaryStringSet } from "../index";
import { wordSet } from "./utils";

function makeRelHelper(
  name: keyof typeof TernaryStringSet.prototype,
): (a: string[], b: string[]) => string[] {
  return function (a: string[], b: string[]): string[] {
    const aSet = new TernaryStringSet(a);
    const bSet = new TernaryStringSet(b);
    const setResult = (aSet[name] as CallableFunction)(bSet);
    const iterableResult = (aSet[name] as CallableFunction)(b);
    expect(setResult).toBe(iterableResult);
    return setResult;
  };
}

const equal = makeRelHelper("equals");
const disjoint = makeRelHelper("isDisjointFrom");
const subset = makeRelHelper("isSubsetOf");
const superset = makeRelHelper("isSupersetOf");

test("equals() with same object is true", () => {
  const set = new TernaryStringSet(["grasshopper", "hippopotamus", "skunk"]);
  expect(set.equals(set)).toBeTruthy();
});

test("equals() accepts any type", () => {
  const set = new TernaryStringSet();
  // !! since this is an empty iterator of code point substrings
  expect(set.equals("")).toBeTruthy();
  expect(set.equals(null)).toBeFalsy();
  expect(set.equals(undefined)).toBeFalsy();
  expect(set.equals(1)).toBeFalsy();
  expect(set.equals({})).toBeFalsy();
  expect(set.equals(Symbol.iterator)).toBeFalsy();
});

test("equals() with empty sets and strings", () => {
  expect(equal([], [])).toBeTruthy();
  expect(equal([""], [])).toBeFalsy();
  expect(equal([], [""])).toBeFalsy();
  expect(equal([""], [""])).toBeTruthy();
});

test("equals() permutations", () => {
  expect(equal([""], ["a"])).toBeFalsy();
  expect(equal([""], ["", "a"])).toBeFalsy();
  expect(equal(["a", ""], [""])).toBeFalsy();
  expect(equal(["a", ""], ["", "a"])).toBeTruthy();

  expect(equal(["a"], [])).toBeFalsy();
  expect(equal([], ["a"])).toBeFalsy();
  expect(equal(["a"], ["a"])).toBeTruthy();

  expect(equal(["a"], ["b"])).toBeFalsy();
  expect(equal(["a", "b"], [])).toBeFalsy();
  expect(equal(["a", "b"], ["a"])).toBeFalsy();
  expect(equal(["a", "b"], ["b"])).toBeFalsy();
  expect(equal(["a", "b"], ["a", "b"])).toBeTruthy();

  expect(equal(["a", "b", "c"], [])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["a"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["b"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["c"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["a", "b"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["a", "c"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["b", "c"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["a", "b", "c"])).toBeTruthy();

  expect(equal([], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["a"], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["b"], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["c"], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["a", "b"], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["a", "c"], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["b", "c"], ["a", "b", "c"])).toBeFalsy();
  expect(equal(["a", "b", "c"], ["a", "b", "c"])).toBeTruthy();
});

test("equals() with word list", () => {
  const lhs = wordSet(false);
  const rhs = wordSet();
  expect(lhs.equals(rhs)).toBeTruthy();
  expect(rhs.equals(lhs)).toBeTruthy();
  rhs.delete("horse");
  expect(lhs.equals(rhs)).toBeFalsy();
});


test("isDisjointFrom() with same object is false", () => {
  const set = new TernaryStringSet(["grasshopper", "hippopotamus", "skunk"]);
  expect(set.isDisjointFrom(set)).toBeFalsy();
});

test("isDisjointFrom() throws on non-iterator", () => {
  const set = new TernaryStringSet();
  expect(() => set.isDisjointFrom(null as unknown as TernaryStringSet)).toThrow();
  expect(() => set.isDisjointFrom(1 as unknown as TernaryStringSet)).toThrow();
});

test("isDisjointFrom() with empty sets and strings", () => {
  expect(disjoint([], [])).toBeTruthy();
  expect(disjoint([""], [])).toBeTruthy();
  expect(disjoint([], [""])).toBeTruthy();
  expect(disjoint([""], [""])).toBeFalsy();
});

test("isDisjointFrom() permutations", () => {
  expect(disjoint([""], ["a"])).toBeTruthy();
  expect(disjoint(["a"], [""])).toBeTruthy();
  expect(disjoint([""], ["", "a"])).toBeFalsy();
  expect(disjoint(["a", ""], [""])).toBeFalsy();

  expect(disjoint(["a"], [])).toBeTruthy();
  expect(disjoint([], ["a"])).toBeTruthy();
  expect(disjoint(["a"], ["a"])).toBeFalsy();

  expect(disjoint(["a"], ["b"])).toBeTruthy();
  expect(disjoint(["a", "b"], [])).toBeTruthy();
  expect(disjoint(["a", "b"], ["a"])).toBeFalsy();
  expect(disjoint(["a", "b"], ["b"])).toBeFalsy();
  expect(disjoint(["a", "b"], ["a", "b"])).toBeFalsy();

  expect(disjoint(["a", "b", "c"], ["d", "e", "f"])).toBeTruthy();
  expect(disjoint(["a", "b", "c"], ["d", "e", "f", "a"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["d", "e", "f", "b"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["d", "e", "f", "c"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["d", "b", "e", "c", "f", "a"])).toBeFalsy();

  expect(disjoint(["a", "b", "c"], [])).toBeTruthy();
  expect(disjoint(["a", "b", "c"], ["a"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["b"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["c"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["a", "b"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["a", "c"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["b", "c"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["a", "b", "c"])).toBeFalsy();

  expect(disjoint([], ["a", "b", "c"])).toBeTruthy();
  expect(disjoint(["a"], ["a", "b", "c"])).toBeFalsy();
  expect(disjoint(["b"], ["a", "b", "c"])).toBeFalsy();
  expect(disjoint(["c"], ["a", "b", "c"])).toBeFalsy();
  expect(disjoint(["a", "b"], ["a", "b", "c"])).toBeFalsy();
  expect(disjoint(["a", "c"], ["a", "b", "c"])).toBeFalsy();
  expect(disjoint(["b", "c"], ["a", "b", "c"])).toBeFalsy();
  expect(disjoint(["a", "b", "c"], ["a", "b", "c"])).toBeFalsy();
});


test("isSubsetOf() with same object is true", () => {
  const set = new TernaryStringSet(["grasshopper", "hippopotamus", "skunk"]);
  expect(set.isSubsetOf(set)).toBeTruthy();
});

test("isSubsetOf() throws on non-iterator", () => {
  const set = new TernaryStringSet();
  expect(() => set.isSubsetOf(null as unknown as TernaryStringSet)).toThrow();
  expect(() => set.isSubsetOf(1 as unknown as TernaryStringSet)).toThrow();
});

test("isSubsetOf() with empty sets and strings", () => {
  expect(subset([], [])).toBeTruthy();
  expect(subset([""], [])).toBeFalsy();
  expect(subset([], [""])).toBeTruthy();
  expect(subset([""], [""])).toBeTruthy();
});

test("isSubsetOf() permutataions", () => {
  expect(subset([""], ["a"])).toBeFalsy();
  expect(subset([""], ["", "a"])).toBeTruthy();
  expect(subset(["a", ""], [""])).toBeFalsy();
  expect(subset(["a", ""], ["", "a"])).toBeTruthy();

  expect(subset(["a"], [])).toBeFalsy();
  expect(subset([], ["a"])).toBeTruthy();
  expect(subset(["a"], ["a"])).toBeTruthy();

  expect(subset(["a"], ["b"])).toBeFalsy();
  expect(subset(["a", "b"], [])).toBeFalsy();
  expect(subset(["a", "b"], ["a"])).toBeFalsy();
  expect(subset(["a", "b"], ["b"])).toBeFalsy();
  expect(subset(["a", "b"], ["a", "b"])).toBeTruthy();

  expect(subset(["a", "b", "c"], [])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["a"])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["b"])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["c"])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["a", "b"])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["a", "c"])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["b", "c"])).toBeFalsy();
  expect(subset(["a", "b", "c"], ["a", "b", "c"])).toBeTruthy();

  expect(subset([], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["a"], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["b"], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["c"], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["a", "b"], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["a", "c"], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["b", "c"], ["a", "b", "c"])).toBeTruthy();
  expect(subset(["a", "b", "c"], ["a", "b", "c"])).toBeTruthy();
});

test("isSubsetOf() with word list", () => {
  const lhs = wordSet(false);
  const rhs = wordSet();
  expect(lhs.isSubsetOf(rhs)).toBeTruthy();
  rhs.delete("horse");
  expect(lhs.isSubsetOf(rhs)).toBeFalsy();
  expect(rhs.isSubsetOf(lhs)).toBeTruthy();
});


test("isSupersetOf() with same object is true", () => {
  const set = new TernaryStringSet(["grasshopper", "hippopotamus", "skunk"]);
  expect(set.isSupersetOf(set)).toBeTruthy();
});

test("isSupersetOf() throws on non-iterator", () => {
  const set = new TernaryStringSet();
  expect(() => set.isSupersetOf(null as unknown as TernaryStringSet)).toThrow();
  expect(() => set.isSupersetOf(1 as unknown as TernaryStringSet)).toThrow();
});

test("isSupersetOf() with empty sets and strings", () => {
  expect(superset([], [])).toBeTruthy();
  expect(superset([""], [])).toBeTruthy();
  expect(superset([], [""])).toBeFalsy();
  expect(superset([""], [""])).toBeTruthy();
});

test("isSupersetOf() permutations", () => {
  expect(superset([""], ["a"])).toBeFalsy();
  expect(superset([""], ["", "a"])).toBeFalsy();
  expect(superset(["a", ""], [""])).toBeTruthy();
  expect(superset(["a", ""], ["", "a"])).toBeTruthy();

  expect(superset(["a"], [])).toBeTruthy();
  expect(superset([], ["a"])).toBeFalsy();
  expect(superset(["a"], ["a"])).toBeTruthy();

  expect(superset(["a"], ["b"])).toBeFalsy();
  expect(superset(["a", "b"], [])).toBeTruthy();
  expect(superset(["a", "b"], ["a"])).toBeTruthy();
  expect(superset(["a", "b"], ["b"])).toBeTruthy();
  expect(superset(["a", "b"], ["a", "b"])).toBeTruthy();

  expect(superset(["a", "b", "c"], [])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["a"])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["b"])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["c"])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["a", "b"])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["a", "c"])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["b", "c"])).toBeTruthy();
  expect(superset(["a", "b", "c"], ["a", "b", "c"])).toBeTruthy();

  expect(superset([], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["a"], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["b"], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["c"], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["a", "b"], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["a", "c"], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["b", "c"], ["a", "b", "c"])).toBeFalsy();
  expect(superset(["a", "b", "c"], ["a", "b", "c"])).toBeTruthy();
});

test("isSupersetOf() with word list", () => {
  const lhs = wordSet(false);
  const rhs = wordSet();
  expect(lhs.isSupersetOf(rhs)).toBeTruthy();
  rhs.add("horses");
  expect(lhs.isSupersetOf(rhs)).toBeFalsy();
  expect(rhs.isSupersetOf(lhs)).toBeTruthy();
});
