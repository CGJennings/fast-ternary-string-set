# Fast ternary string set

A fast string set based on ternary search trees. Features:

 - Drop-in replacement for most code that uses a standard [JavaScript `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of string elements.
 - All search results and iteration methods list elements in ascending sorted (lexicographic) order.
 - Includes several approximate matching methods:
   1. List all elements that can be made from a given list of letters.
   2. List all elements that match a pattern including "don't care" letters (as `.` in a regular expression).
   3. List all elements within a specified [Hamming distance](https://en.wikipedia.org/wiki/Hamming_distance) of a pattern.
 - All matching, including approximate matching, is based on full code points and not char codes.
 - Balances search time and memory consumption: stored strings share tree nodes and do not require a reference to the original strings.
 - The tree structure is encoded in a form that is friendly to common JS engine optimizations.
 - Elements are stored by Unicode code point; any valid Unicode string can be added to a set.
 - Sets can be serialized to a compact binary format (as an `ArrayBuffer`).
 - Written in fully documented TypeScript, targeting modern JavaScript engines.
 - Backed by extensive test suites.
 - No other dependencies.

## Installation

To install the latest stable version:

```bash
npm install fast-ternary-string-set
```

Or, if using `yarn`, `yarn add fast-ternary-string-set`.

Alternatively, to use it without Node.js, copy the the main source file (`src/index.ts`) into any TypeScript project, then import the copied file in your code.

## Examples of use

To load the module:

```js
const { TernaryStringSet } = require("fast-ternary-string-set");
```

Or, from TypeScript:

```js
import { TernaryStringSet } from "fast-ternary-string-set";
```

Create a new string set and add some strings:

```js
const set = new TernaryStringSet();
set.add("dog").add("cat").add("eagle");
set.has("cat");
// => true
set.delete("cat");
// => true since "cat" was in the set
set.has("cat");
// => false
set.has(123.456);
// => false (any non-string returns false)
```

Add an entire array of string elements:

```js
const stringArray = [
    "aardvark", "beaver", "cat",
    "dog", "eagle", /* ..., */ "zebra"
];
set.addAll(stringArray);
```

Iterate over all elements in sorted order:

```js
for (const el of set) {
    console.log(el);
}
// or equivalently:
set.forEach((el) => console.log(el));
```

Find all elements that can be made from the letters of "taco":

```js
set.getArrangementsOf("taco");
// => ["act", "cat", "coat", "taco"] (for example)
```

Find all elements within Hamming distance 1 of "cat":

```js
set.getWithinHammingDistanceOf("cat", 1);
// => ["bat", "can", "cap", "cat", "cot", "sat"] (for example)
```

Find all elements that match "b.t":

```js
set.getPartialMatchesOf("b.t");
// => ["bat", "bet", "bit", "bot", "but"] (for example)
```

Serialize to or from a binary blob:

```js
// write a set to an ArrayBuffer
const buff = set.toBuffer();

// create a new set from a previously saved ArrayBuffer
const set = TernaryStringSet.fromBuffer(buff);
```

## Differences from standard JS `Set`

`TernaryStringSet` supports a superset of the standard `Set` interface, but it is not a subclass of `Set`.

JavaScript `Set` objects guarantee that they iterate over elements in the order that they are added.
`TernaryStringSet`s always return results in sorted order.

`TernaryStringSet`s can contain the empty string, but cannot contain non-strings. This includes `null` and `undefined`.

The `size` method runs in time proportional to the number of tree nodes rather than constant time.

## Tips

Adding strings to a ternary tree in sorted order produces a worst-case tree structure. This can be avoided by adding
sorted strings using the `addAll` method, which produces an optimal tree structure given a sorted input array.
Alternatively, the `balance` method can be called to rebuild the tree with optimal structure, but this is expensive.

After deleting a large number of strings, future search performance may be improved by calling `balance`.

An ideal use case for this data structure is one in which the tree will be generated ahead of time and then used to
test elements or perform approximate matching. During the generation phase, strings can be added in arbitrary order,
then the tree can be `balance`d and serialized to an `ArrayBuffer`. The set can then be used by loading the tree data
directly from the loaded binary data, bypassing the need to load and add individual strings.

## Developing

Building from source requires Node.js. Clone the repository, then install development dependencies:

```bash
npm install
```

The TypeScript source is found under `src`. Compiled output is written to `lib`. To build the project:

```bash
npm run build
```

The included `tsconfig.json` targets ES2015 (ES6). To target old JavaScript engines or browsers you will need to modify this configuration and/or use a tool like Babel.

The project includes an extensive suite of tests under `src/tests`. To run all tests:

```bash
npm test
```