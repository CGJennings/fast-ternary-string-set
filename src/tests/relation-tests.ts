import { TernaryStringSet } from "../index";
import { wordSet } from "./utils";

function S(...args: string[]) {
  return new TernaryStringSet([...args]);
}

const T = S;

test("Equality relation", () => {
  expect(S().equals(T())).toBeTruthy();
  expect(S("").equals(T())).toBeFalsy();
  expect(S().equals(T(""))).toBeFalsy();
  expect(S("").equals(T(""))).toBeTruthy();

  expect(S("").equals(T("a"))).toBeFalsy();
  expect(S("").equals(T("", "a"))).toBeFalsy();
  expect(S("a", "").equals(T(""))).toBeFalsy();
  expect(S("a", "").equals(T("", "a"))).toBeTruthy();

  expect(S("a").equals(T())).toBeFalsy();
  expect(S().equals(T("a"))).toBeFalsy();
  expect(S("a").equals(T("a"))).toBeTruthy();

  expect(S("a").equals(T("b"))).toBeFalsy();
  expect(S("a", "b").equals(T())).toBeFalsy();
  expect(S("a", "b").equals(T("a"))).toBeFalsy();
  expect(S("a", "b").equals(T("b"))).toBeFalsy();
  expect(S("a", "b").equals(T("a", "b"))).toBeTruthy();

  expect(S("a", "b", "c").equals(T())).toBeFalsy();
  expect(S("a", "b", "c").equals(T("a"))).toBeFalsy();
  expect(S("a", "b", "c").equals(T("b"))).toBeFalsy();
  expect(S("a", "b", "c").equals(T("c"))).toBeFalsy();
  expect(S("a", "b", "c").equals(T("a", "b"))).toBeFalsy();
  expect(S("a", "b", "c").equals(T("a", "c"))).toBeFalsy();
  expect(S("a", "b", "c").equals(T("b", "c"))).toBeFalsy();
  expect(S("a", "b", "c").equals(T("a", "b", "c"))).toBeTruthy();

  expect(T().equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("a").equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("b").equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("c").equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("a", "b").equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("a", "c").equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("b", "c").equals(S("a", "b", "c"))).toBeFalsy();
  expect(T("a", "b", "c").equals(S("a", "b", "c"))).toBeTruthy();
});

test("Equality relation with word list", () => {
  const lhs = wordSet(false);
  const rhs = wordSet();
  expect(lhs.equals(rhs)).toBeTruthy();
  expect(rhs.equals(lhs)).toBeTruthy();
  rhs.delete("horse");
  expect(lhs.equals(rhs)).toBeFalsy();
});

test("Subset relation", () => {
  expect(S().isSubsetOf(T())).toBeTruthy();
  expect(S("").isSubsetOf(T())).toBeFalsy();
  expect(S().isSubsetOf(T(""))).toBeTruthy();
  expect(S("").isSubsetOf(T(""))).toBeTruthy();

  expect(S("").isSubsetOf(T("a"))).toBeFalsy();
  expect(S("").isSubsetOf(T("", "a"))).toBeTruthy();
  expect(S("a", "").isSubsetOf(T(""))).toBeFalsy();
  expect(S("a", "").isSubsetOf(T("", "a"))).toBeTruthy();

  expect(S("a").isSubsetOf(T())).toBeFalsy();
  expect(S().isSubsetOf(T("a"))).toBeTruthy();
  expect(S("a").isSubsetOf(T("a"))).toBeTruthy();

  expect(S("a").isSubsetOf(T("b"))).toBeFalsy();
  expect(S("a", "b").isSubsetOf(T())).toBeFalsy();
  expect(S("a", "b").isSubsetOf(T("a"))).toBeFalsy();
  expect(S("a", "b").isSubsetOf(T("b"))).toBeFalsy();
  expect(S("a", "b").isSubsetOf(T("a", "b"))).toBeTruthy();

  expect(S("a", "b", "c").isSubsetOf(T())).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("a"))).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("b"))).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("c"))).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("a", "b"))).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("a", "c"))).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("b", "c"))).toBeFalsy();
  expect(S("a", "b", "c").isSubsetOf(T("a", "b", "c"))).toBeTruthy();

  expect(T().isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("a").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("b").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("c").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("a", "b").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("a", "c").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("b", "c").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
  expect(T("a", "b", "c").isSubsetOf(S("a", "b", "c"))).toBeTruthy();
});

test("Subset relation with word list", () => {
  const lhs = wordSet(false);
  const rhs = wordSet();
  expect(lhs.isSubsetOf(rhs)).toBeTruthy();
  rhs.delete("horse");
  expect(lhs.isSubsetOf(rhs)).toBeFalsy();
  expect(rhs.isSubsetOf(lhs)).toBeTruthy();
});

test("Superset relation", () => {
  expect(S().isSupersetOf(T())).toBeTruthy();
  expect(S("").isSupersetOf(T())).toBeTruthy();
  expect(S().isSupersetOf(T(""))).toBeFalsy();
  expect(S("").isSupersetOf(T(""))).toBeTruthy();

  expect(S("").isSupersetOf(T("a"))).toBeFalsy();
  expect(S("").isSupersetOf(T("", "a"))).toBeFalsy();
  expect(S("a", "").isSupersetOf(T(""))).toBeTruthy();
  expect(S("a", "").isSupersetOf(T("", "a"))).toBeTruthy();

  expect(S("a").isSupersetOf(T())).toBeTruthy();
  expect(S().isSupersetOf(T("a"))).toBeFalsy();
  expect(S("a").isSupersetOf(T("a"))).toBeTruthy();

  expect(S("a").isSupersetOf(T("b"))).toBeFalsy();
  expect(S("a", "b").isSupersetOf(T())).toBeTruthy();
  expect(S("a", "b").isSupersetOf(T("a"))).toBeTruthy();
  expect(S("a", "b").isSupersetOf(T("b"))).toBeTruthy();
  expect(S("a", "b").isSupersetOf(T("a", "b"))).toBeTruthy();

  expect(S("a", "b", "c").isSupersetOf(T())).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("a"))).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("b"))).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("c"))).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("a", "b"))).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("a", "c"))).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("b", "c"))).toBeTruthy();
  expect(S("a", "b", "c").isSupersetOf(T("a", "b", "c"))).toBeTruthy();

  expect(T().isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("a").isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("b").isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("c").isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("a", "b").isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("a", "c").isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("b", "c").isSupersetOf(S("a", "b", "c"))).toBeFalsy();
  expect(T("a", "b", "c").isSupersetOf(S("a", "b", "c"))).toBeTruthy();
});

test("Superset relation with word list", () => {
  const lhs = wordSet(false);
  const rhs = wordSet();
  expect(lhs.isSupersetOf(rhs)).toBeTruthy();
  rhs.add("horses");
  expect(lhs.isSupersetOf(rhs)).toBeFalsy();
  expect(rhs.isSupersetOf(lhs)).toBeTruthy();
});

test("Non-sets throw, except for equality", () => {
  const set = new TernaryStringSet();
  expect(set.equals("")).toBeFalsy();
  expect(set.equals(1)).toBeFalsy();
  expect(set.equals({})).toBeFalsy();
  expect(set.equals(Symbol.iterator)).toBeFalsy();
  expect(() => set.isSubsetOf(1 as unknown as TernaryStringSet)).toThrow();
  expect(() => set.isSupersetOf(1 as unknown as TernaryStringSet)).toThrow();
});