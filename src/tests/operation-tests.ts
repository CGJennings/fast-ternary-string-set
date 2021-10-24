import { TernaryStringSet } from "../index";

function union(a: string[], b: string[]): string[] {
  const u = new TernaryStringSet(a).union(new TernaryStringSet(b));
  const v = Array.from(u);
  expect(u.size).toBe(v.length);
  return v;
}

function inter(a: string[], b: string[]): string[] {
  const u = new TernaryStringSet(a).intersection(new TernaryStringSet(b));
  const v = Array.from(u);
  expect(u.size).toBe(v.length);
  return v;
}

function sub(a: string[], b: string[]): string[] {
  const u = new TernaryStringSet(a).subtract(new TernaryStringSet(b));
  const v = Array.from(u);
  expect(u.size).toBe(v.length);
  return v;
}

function sdiff(a: string[], b: string[]): string[] {
  const u = new TernaryStringSet(a).symmetricDifference(
    new TernaryStringSet(b),
  );
  const v = Array.from(u);
  expect(u.size).toBe(v.length);
  return v;
}

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

test("Subtraction", () => {
  expect(sub([], [])).toEqual([]);
  expect(sub([], [""])).toEqual([]);
  expect(sub([""], [])).toEqual([""]);
  expect(sub([""], [""])).toEqual([]);
  expect(sub([""], ["a"])).toEqual([""]);
  expect(sub(["a"], [""])).toEqual(["a"]);
  expect(sub(["a"], ["a"])).toEqual([]);
  expect(sub(["a"], ["b"])).toEqual(["a"]);
  expect(sub(["b"], ["a"])).toEqual(["b"]);
  expect(sub(["a", "b"], [])).toEqual(["a", "b"]);
  expect(sub([], ["a", "b"])).toEqual([]);
  expect(sub(["a", "b"], ["b"])).toEqual(["a"]);
  expect(sub(["a", "b"], ["a"])).toEqual(["b"]);
  expect(sub(["a"], ["a", "b"])).toEqual([]);
  expect(sub(["b"], ["a", "b"])).toEqual([]);
  expect(sub(["a", "b"], ["a", "b"])).toEqual([]);
  expect(sub(["a", "b", "c"], ["a", "b"])).toEqual(["c"]);
  expect(sub(["a", "b"], ["a", "b", "c"])).toEqual([]);
  expect(sub(["b", "c"], ["a", "b"])).toEqual(["c"]);
  expect(sub(["b"], ["a", "b", "c"])).toEqual([]);
  expect(sub(["a", "c"], ["b"])).toEqual(["a", "c"]);
  expect(sub(["b", "c"], ["a"])).toEqual(["b", "c"]);
  expect(sub(["a", "b", "c"], ["a", "b", "c"])).toEqual([]);
  expect(
    sub(
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

test("operations on non-sets throw", () => {
  const set = new TernaryStringSet();
  expect(() => set.union(1 as unknown as TernaryStringSet)).toThrow();
  expect(() => set.intersection(1 as unknown as TernaryStringSet)).toThrow();
  expect(() => set.subtract(1 as unknown as TernaryStringSet)).toThrow();
  expect(() =>
    set.symmetricDifference(1 as unknown as TernaryStringSet),
  ).toThrow();
});
