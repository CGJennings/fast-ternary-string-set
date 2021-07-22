import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
    tree = new TernaryStringSet();
});

test("Add/delete empty string", () => {
    tree.add("").add("horse");
    expect(tree.size).toBe(2);
    expect(tree.has("")).toBe(true);
    tree.delete("");
    expect(tree.size).toBe(1);
    expect(tree.has("")).toBe(false);
});

test("Delete non-member", () => {
    expect(tree.size).toBe(0);
    tree.add("dog");
    expect(tree.size).toBe(1);
    expect(tree.has("cat")).toBe(false);
    expect(tree.delete("cat")).toBe(false);
    expect(tree.size).toBe(1);
});

test("Delete member", () => {
    expect(tree.size).toBe(0);
    tree.add("dog");
    expect(tree.size).toBe(1);
    expect(tree.has("dog")).toBe(true);
    expect(tree.delete("dog")).toBe(true);
    expect(tree.size).toBe(0);
});

test("Delete multiple", () => {
    tree.addAll(words);
    let size = tree.size;
    const randomOrder = shuffle([...words]);

    for (const w of randomOrder) {
        expect(tree.size).toBe(size--);
        expect(tree.has(w)).toBe(true);
        expect(tree.delete(w)).toBe(true);
        expect(tree.has(w)).toBe(false);
    }
    expect(tree.size).toBe(0);
});

function shuffle<T>(array: T[]): T[] {
    let i = array.length, toSwap;
    while (i > 0) {
        toSwap = Math.floor(Math.random() * i);
        const temp = array[--i];
        array[i] = array[toSwap];
        array[toSwap] = temp;
    }
    return array;
}
