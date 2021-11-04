import { TernaryStringSet } from "../index";

function makeOperationHelper(
  name: keyof typeof TernaryStringSet.prototype,
): (a: string[], b: string[]) => string[] {
  return function (a: string[], b: string[]): string[] {
    const aSet = new TernaryStringSet(a);
    const bSet = new TernaryStringSet(b);
    const setResult = (aSet[name] as CallableFunction)(bSet);
    const iterableResult = (aSet[name] as CallableFunction)(b);
    const resultArray = setResult.toArray();
    expect(resultArray).toEqual(iterableResult.toArray());
    expect(setResult.equals(iterableResult)).toBeTruthy();
    return resultArray;
  };
}

const union = makeOperationHelper("union");
const inter = makeOperationHelper("intersection");
const diff = makeOperationHelper("difference");
const sdiff = makeOperationHelper("symmetricDifference");

test("Union", () => {
  expect(union([], [])).toEqual([]);
  expect(union([], [""])).toEqual([""]);
  expect(union([""], [])).toEqual([""]);
  expect(union([""], [""])).toEqual([""]);
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
  expect(
    union(["fish", "horse", "monkey", "rhino"], ["emu", "monkey", "mouse"]),
  ).toEqual(["emu", "fish", "horse", "monkey", "mouse", "rhino"]);
});

test("Intersection", () => {
  expect(inter([], [])).toEqual([]);
  expect(inter([], [""])).toEqual([]);
  expect(inter([""], [])).toEqual([]);
  expect(inter([""], [""])).toEqual([""]);
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
  expect(
    inter(
      ["fish", "frog", "horse", "monkey", "rhino"],
      ["emu", "frog", "monkey", "mouse"],
    ),
  ).toEqual(["frog", "monkey"]);
});

test("Difference", () => {
  expect(diff([], [])).toEqual([]);
  expect(diff([], [""])).toEqual([]);
  expect(diff([""], [])).toEqual([""]);
  expect(diff([""], [""])).toEqual([]);
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
  expect(
    diff(
      ["fish", "frog", "horse", "monkey", "rhino"],
      ["emu", "frog", "monkey", "mouse"],
    ),
  ).toEqual(["fish", "horse", "rhino"]);
});

test("Symmetric difference", () => {
  expect(sdiff([], [])).toEqual([]);
  expect(sdiff([], [""])).toEqual([""]);
  expect(sdiff([""], [])).toEqual([""]);
  expect(sdiff([""], [""])).toEqual([]);
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
  expect(
    sdiff(
      ["fish", "frog", "horse", "monkey", "rhino"],
      ["emu", "frog", "monkey", "mouse"],
    ),
  ).toEqual(["emu", "fish", "horse", "mouse", "rhino"]);
});

test("Operations on non-iterables throw", () => {
  const set = new TernaryStringSet();
  expect(() => set.union(1 as unknown as TernaryStringSet)).toThrow();
  expect(() => set.intersection(1 as unknown as TernaryStringSet)).toThrow();
  expect(() => set.difference(1 as unknown as TernaryStringSet)).toThrow();
  expect(() =>
    set.symmetricDifference(1 as unknown as TernaryStringSet),
  ).toThrow();
});
