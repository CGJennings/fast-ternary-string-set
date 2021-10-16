import { TernaryStringSet } from "../index";
import { sameSet } from "./utils";

test("No-arg constructor yields empty set", () => {
  expect(new TernaryStringSet().size).toBe(0);
});

test("Non-iterable constructor argument throws", () => {
  expect(
    () => new TernaryStringSet(1 as unknown as Iterable<string>),
  ).toThrow();
  expect(
    () => new TernaryStringSet({} as unknown as Iterable<string>),
  ).toThrow();
});

test("Empty iterable constructor yields empty set", () => {
  expect(new TernaryStringSet([]).size).toBe(0);
  expect(new TernaryStringSet(new Set()).size).toBe(0);
  expect(new TernaryStringSet("").size).toBe(0);
});

test("TernaryStringTree constructor argument yields equivalent set", () => {
  const t1 = new TernaryStringSet();
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
  t1.add("");
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
  t1.addAll(["ankle", "spoon", "xenomorph"]);
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
  t1.delete("");
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
  t1.delete("spoon");
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
  t1.delete("ankle");
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
  t1.delete("xenomorph");
  expect(sameSet(t1, new TernaryStringSet(t1))).toBeTruthy();
});

test("Array constructor argument yields equivalent set", () => {
  const addAll = (a: string[]) => {
    const set = new TernaryStringSet();
    set.addAll(a);
    return set;
  };
  let a = ["axolotl"];
  expect(sameSet(addAll(a), new TernaryStringSet(a))).toBeTruthy();
  a = ["tardigrade", "zebu"];
  expect(sameSet(addAll(a), new TernaryStringSet(a))).toBeTruthy();
  a = ["", "dog", "cat", "shoebill"];
  expect(sameSet(addAll(a), new TernaryStringSet(a))).toBeTruthy();
  a = ["dog", "cat", "shoebill"];
  expect(sameSet(addAll(a), new TernaryStringSet(a))).toBeTruthy();
});

class GenericIterator implements Iterator<string> {
  i = 1;
  next(): IteratorResult<string> {
    return this.i < 5
      ? { done: false, value: String(this.i++) }
      : { done: true, value: undefined };
  }
}

test("Generic iterable yields equivalent set", () => {
  const itTree = (it: Iterable<string>) => {
    const set = new TernaryStringSet();
    set.addAll(Array.from(it));
    return set;
  };

  let it: Iterable<string> = new Set();
  expect(sameSet(itTree(it), new TernaryStringSet(it))).toBeTruthy();
  (it as Set<string>).add("quetzal").add("umbrellabird");
  expect(sameSet(itTree(it), new TernaryStringSet(it))).toBeTruthy();
  it = "hello, world!";
  expect(sameSet(itTree(it), new TernaryStringSet(it))).toBeTruthy();
  it = {
    [Symbol.iterator]: () => new GenericIterator(),
  };
  expect(sameSet(itTree(it), new TernaryStringSet(it))).toBeTruthy();
});
