import { TernaryStringSet } from "../fast-ternary-string-set";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("join() of empty set produces empty string", () => {
  expect(set.join()).toBe("");
});

test("join() of empty string singleton produces empty string", () => {
  expect(set.add("").join()).toBe("");
});

test("join() of empty string with other produces initial separator", () => {
  expect(set.addAll(["", "caterpillar"]).join()).toBe(",caterpillar");
});

test("join() of singleton produces no separator", () => {
  expect(set.add("frog").join()).toBe("frog");
});

test("join() of two or more elements produces separator", () => {
  expect(set.addAll(["frog", "tadpole"]).join()).toBe("frog,tadpole");
  set.clear();
  expect(set.addAll(["bedbug", "beetle", "spider"]).join()).toBe(
    "bedbug,beetle,spider",
  );
});

test("join() accepts custom separator", () => {
  expect(set.addAll(["bee", "bird"]).join("+*=")).toBe("bee+*=bird");
  set.clear();
  expect(set.addAll(["rattle", "snake"]).join("")).toBe("rattlesnake");
});

test("join() coerces non-string separator", () => {
  expect(
    set.addAll(["cuckoo", "roadrunner"]).join(true as unknown as string),
  ).toBe("cuckootrueroadrunner");
});
