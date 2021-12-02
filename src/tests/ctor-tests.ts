import { TernaryStringSet } from "../index";
import { expectSameSet } from "./utils";

test("TernaryStringSet() no-arg constructor yields empty set", () => {
  expect(new TernaryStringSet().size).toBe(0);
});

test("TernaryStringSet() non-iterable argument throws", () => {
  expect(
    () => new TernaryStringSet(1 as unknown as Iterable<string>),
  ).toThrow();
  expect(
    () => new TernaryStringSet({} as unknown as Iterable<string>),
  ).toThrow();
});

test("TernaryStringSet() empty iterable yields empty set", () => {
  expect(new TernaryStringSet([]).size).toBe(0);
  expect(new TernaryStringSet(new Set()).size).toBe(0);
  expect(new TernaryStringSet("").size).toBe(0);
});

test("TernaryStringSet() set yields equivalent set", () => {
  const t1 = new TernaryStringSet();
  expectSameSet(t1, new TernaryStringSet(t1));
  t1.add("");
  expectSameSet(t1, new TernaryStringSet(t1));
  t1.addAll(["ankle", "spoon", "xenomorph"]);
  expectSameSet(t1, new TernaryStringSet(t1));
  t1.delete("");
  expectSameSet(t1, new TernaryStringSet(t1));
  t1.delete("spoon");
  expectSameSet(t1, new TernaryStringSet(t1));
  t1.delete("ankle");
  expectSameSet(t1, new TernaryStringSet(t1));
  t1.delete("xenomorph");
  expectSameSet(t1, new TernaryStringSet(t1));
});

test("TernaryStringSet() array yields equivalent set", () => {
  const addAll = (a: string[]) => {
    const set = new TernaryStringSet();
    set.addAll(a);
    return set;
  };
  let a = ["axolotl"];
  expectSameSet(addAll(a), new TernaryStringSet(a));
  a = ["tardigrade", "zebu"];
  expectSameSet(addAll(a), new TernaryStringSet(a));
  a = ["", "dog", "cat", "shoebill"];
  expectSameSet(addAll(a), new TernaryStringSet(a));
  a = ["dog", "cat", "shoebill"];
  expectSameSet(addAll(a), new TernaryStringSet(a));
});

class GenericIterator implements Iterator<string> {
  i = 1;
  next(): IteratorResult<string> {
    return this.i < 5
      ? { done: false, value: String(this.i++) }
      : { done: true, value: undefined };
  }
}

test("TernaryStringSet() iterable yields equivalent set", () => {
  const itTree = (it: Iterable<string>) => {
    const set = new TernaryStringSet();
    set.addAll(Array.from(it));
    return set;
  };

  let it: Iterable<string> = new Set();
  expectSameSet(itTree(it), new TernaryStringSet(it));
  (it as Set<string>).add("quetzal").add("umbrellabird");
  expectSameSet(itTree(it), new TernaryStringSet(it));
  it = "hello, world!";
  expectSameSet(itTree(it), new TernaryStringSet(it));
  it = {
    [Symbol.iterator]: () => new GenericIterator(),
  };
  expectSameSet(itTree(it), new TernaryStringSet(it));
});

test("[Symbol.toStringTag] makes toString() matches class name", () => {
  expect(new TernaryStringSet().toString()).toBe("[object TernaryStringSet]");
});
