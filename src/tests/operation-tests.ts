import { TernaryStringSet } from "../fast-ternary-string-set";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

function makeOperationHelper(
  name: keyof typeof TernaryStringSet.prototype,
): (a: string[], b: string[]) => string[] {
  return function (a: string[], b: string[]): string[] {
    const aSet = new TernaryStringSet(a);
    const bSet = new TernaryStringSet(b);
    const setResult = (aSet[name] as CallableFunction)(bSet);
    const iterableResult = (aSet[name] as CallableFunction)(b);
    const resultArray = setResult.toArray();
    expect(setResult.size).toBe(resultArray.length);
    expect(iterableResult.size).toBe(resultArray.length);
    expect(resultArray).toEqual(iterableResult.toArray());
    expect(setResult.equals(iterableResult)).toBeTruthy();
    return resultArray;
  };
}

const union = makeOperationHelper("union");
const inter = makeOperationHelper("intersection");
const diff = makeOperationHelper("difference");
const sdiff = makeOperationHelper("symmetricDifference");

test("union() on non-iterable throws", () => {
  expect(() => set.union(null as unknown as TernaryStringSet)).toThrow();
  expect(() => set.union(1 as unknown as TernaryStringSet)).toThrow();
});

test("union() with empty sets and strings", () => {
  expect(union([], [])).toEqual([]);
  expect(union([], [""])).toEqual([""]);
  expect(union([""], [])).toEqual([""]);
  expect(union([""], [""])).toEqual([""]);
});

test("union() basic permutations", () => {
  expect(union([""], ["a"])).toEqual(["", "a"]);
  expect(union(["a"], [""])).toEqual(["", "a"]);
  expect(union(["a"], ["a"])).toEqual(["a"]);
  expect(union(["a"], ["b"])).toEqual(["a", "b"]);
  expect(union(["b"], ["a"])).toEqual(["a", "b"]);
  expect(union(["a", "b"], [])).toEqual(["a", "b"]);
  expect(union([], ["a", "b"])).toEqual(["a", "b"]);
  expect(union(["a", "b"], ["b"])).toEqual(["a", "b"]);
  expect(union(["a", "b"], ["a"])).toEqual(["a", "b"]);
  expect(union(["a"], ["a", "b"])).toEqual(["a", "b"]);
  expect(union(["b"], ["a", "b"])).toEqual(["a", "b"]);
  expect(union(["a", "b"], ["a", "b"])).toEqual(["a", "b"]);
  expect(union(["a", "b", "c"], ["a", "b"])).toEqual(["a", "b", "c"]);
  expect(union(["a", "b"], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
  expect(union(["b", "c"], ["a", "b"])).toEqual(["a", "b", "c"]);
  expect(union(["b"], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
  expect(union(["a", "c"], ["b"])).toEqual(["a", "b", "c"]);
  expect(union(["b", "c"], ["a"])).toEqual(["a", "b", "c"]);
});

test("union() with complex strings", () => {
  expect(
    union(["fish", "horse", "monkey", "rhino"], ["emu", "monkey", "mouse"]),
  ).toEqual(["emu", "fish", "horse", "monkey", "mouse", "rhino"]);
});

test("intersection() on non-iterable throws", () => {
  expect(() => set.intersection(null as unknown as TernaryStringSet)).toThrow();
  expect(() => set.intersection(1 as unknown as TernaryStringSet)).toThrow();
});

test("intersection() with empty sets and strings", () => {
  expect(inter([], [])).toEqual([]);
  expect(inter([], [""])).toEqual([]);
  expect(inter([""], [])).toEqual([]);
  expect(inter([""], [""])).toEqual([""]);
});

test("intersection() basic permutations", () => {
  expect(inter([""], ["a"])).toEqual([]);
  expect(inter(["a"], [""])).toEqual([]);
  expect(inter(["a"], ["a"])).toEqual(["a"]);
  expect(inter(["a"], ["b"])).toEqual([]);
  expect(inter(["b"], ["a"])).toEqual([]);
  expect(inter(["a", "b"], [])).toEqual([]);
  expect(inter([], ["a", "b"])).toEqual([]);
  expect(inter(["a", "b"], ["b"])).toEqual(["b"]);
  expect(inter(["a", "b"], ["a"])).toEqual(["a"]);
  expect(inter(["a"], ["a", "b"])).toEqual(["a"]);
  expect(inter(["b"], ["a", "b"])).toEqual(["b"]);
  expect(inter(["a", "b"], ["a", "b"])).toEqual(["a", "b"]);
  expect(inter(["a", "b", "c"], ["a", "b"])).toEqual(["a", "b"]);
  expect(inter(["a", "b"], ["a", "b", "c"])).toEqual(["a", "b"]);
  expect(inter(["b", "c"], ["a", "b"])).toEqual(["b"]);
  expect(inter(["b"], ["a", "b", "c"])).toEqual(["b"]);
  expect(inter(["a", "c"], ["b"])).toEqual([]);
  expect(inter(["b", "c"], ["a"])).toEqual([]);
  expect(inter(["a", "b", "c"], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
});

test("intersection() with complex strings", () => {
  expect(
    inter(
      ["fish", "frog", "horse", "monkey", "rhino"],
      ["emu", "frog", "monkey", "mouse"],
    ),
  ).toEqual(["frog", "monkey"]);
});

test("difference() on non-iterable throws", () => {
  expect(() => set.difference(null as unknown as TernaryStringSet)).toThrow();
  expect(() => set.difference(1 as unknown as TernaryStringSet)).toThrow();
});

test("difference() with empty sets and strings", () => {
  expect(diff([], [])).toEqual([]);
  expect(diff([], [""])).toEqual([]);
  expect(diff([""], [])).toEqual([""]);
  expect(diff([""], [""])).toEqual([]);
});

test("difference() basic permutations", () => {
  expect(diff([""], ["a"])).toEqual([""]);
  expect(diff(["a"], [""])).toEqual(["a"]);
  expect(diff(["a"], ["a"])).toEqual([]);
  expect(diff(["a"], ["b"])).toEqual(["a"]);
  expect(diff(["b"], ["a"])).toEqual(["b"]);
  expect(diff(["a", "b"], [])).toEqual(["a", "b"]);
  expect(diff([], ["a", "b"])).toEqual([]);
  expect(diff(["a", "b"], ["b"])).toEqual(["a"]);
  expect(diff(["a", "b"], ["a"])).toEqual(["b"]);
  expect(diff(["a"], ["a", "b"])).toEqual([]);
  expect(diff(["b"], ["a", "b"])).toEqual([]);
  expect(diff(["a", "b"], ["a", "b"])).toEqual([]);
  expect(diff(["a", "b", "c"], ["a", "b"])).toEqual(["c"]);
  expect(diff(["a", "b"], ["a", "b", "c"])).toEqual([]);
  expect(diff(["b", "c"], ["a", "b"])).toEqual(["c"]);
  expect(diff(["b"], ["a", "b", "c"])).toEqual([]);
  expect(diff(["a", "c"], ["b"])).toEqual(["a", "c"]);
  expect(diff(["b", "c"], ["a"])).toEqual(["b", "c"]);
  expect(diff(["a", "b", "c"], ["a", "b", "c"])).toEqual([]);
});

test("difference() with complex strings", () => {
  expect(
    diff(
      ["fish", "frog", "horse", "monkey", "rhino"],
      ["emu", "frog", "monkey", "mouse"],
    ),
  ).toEqual(["fish", "horse", "rhino"]);
});

test("symmetricDifference() on non-iterable throws", () => {
  expect(() =>
    set.symmetricDifference(null as unknown as TernaryStringSet),
  ).toThrow();
  expect(() =>
    set.symmetricDifference(1 as unknown as TernaryStringSet),
  ).toThrow();
});

test("symmetricDifference() with empty sets and strings", () => {
  expect(sdiff([], [])).toEqual([]);
  expect(sdiff([], [""])).toEqual([""]);
  expect(sdiff([""], [])).toEqual([""]);
  expect(sdiff([""], [""])).toEqual([]);
});

test("symmetricDifference() basic permutations", () => {
  expect(sdiff([""], ["a"])).toEqual(["", "a"]);
  expect(sdiff(["a"], [""])).toEqual(["", "a"]);
  expect(sdiff(["a"], ["a"])).toEqual([]);
  expect(sdiff(["a"], ["b"])).toEqual(["a", "b"]);
  expect(sdiff(["b"], ["a"])).toEqual(["a", "b"]);
  expect(sdiff(["a", "b"], [])).toEqual(["a", "b"]);
  expect(sdiff([], ["a", "b"])).toEqual(["a", "b"]);
  expect(sdiff(["a", "b"], ["b"])).toEqual(["a"]);
  expect(sdiff(["a", "b"], ["a"])).toEqual(["b"]);
  expect(sdiff(["a"], ["a", "b"])).toEqual(["b"]);
  expect(sdiff(["b"], ["a", "b"])).toEqual(["a"]);
  expect(sdiff(["a", "b"], ["a", "b"])).toEqual([]);
  expect(sdiff(["a", "b", "c"], ["a", "b"])).toEqual(["c"]);
  expect(sdiff(["a", "b"], ["a", "b", "c"])).toEqual(["c"]);
  expect(sdiff(["b", "c"], ["a", "b"])).toEqual(["a", "c"]);
  expect(sdiff(["b"], ["a", "b", "c"])).toEqual(["a", "c"]);
  expect(sdiff(["a", "c"], ["b"])).toEqual(["a", "b", "c"]);
  expect(sdiff(["b", "c"], ["a"])).toEqual(["a", "b", "c"]);
  expect(sdiff(["a", "b", "c"], ["a", "b", "c"])).toEqual([]);
});

test("symmetricDifference() with complex strings", () => {
  expect(
    sdiff(
      ["fish", "frog", "horse", "monkey", "rhino"],
      ["emu", "frog", "monkey", "mouse"],
    ),
  ).toEqual(["emu", "fish", "horse", "mouse", "rhino"]);
});
