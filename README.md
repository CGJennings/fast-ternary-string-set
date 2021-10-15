# Fast ternary string set

A fast, space-efficient, serializable string set based on ternary search trees, with both exact and approximate membership tests.

## Features

 - Drop-in replacement for nearly any use of a [JavaScript `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of strings.
 - Search and iteration methods return elements in ascending sorted (lexicographic) order.
 - Set relations (equality, subset, superset) and operations (union, intersection, difference, symmetric difference).
 - Several approximate matching methods:
   1. List strings that complete a prefix.
   2. List strings that can be made from a list of letters.
   3. List strings that match a pattern including "don't care" letters (as `.` in a regular expression).
   4. List strings within a certain [Hamming distance](https://en.wikipedia.org/wiki/Hamming_distance) of a pattern.
 - Serialize sets to and from an `ArrayBuffer`.
 - Time and space efficient:
   - Leverages common JS engine optimizations under the hood.
   - Elements share tree nodes and do not retain references to the original strings.
   - Read-only sets can be *compacted* to save even more space.
 - Well-documented TypeScript source, targeting modern JavaScript by default.
 - Backed by extensive test suites.
 - Use as a standalone/ECMAScript module or as a Node.js/CommonJS module.
 - No other dependencies.

## Installation

To install the latest stable version with `npm`:

```bash
npm install fast-ternary-string-set
```

Or, if using `yarn`:

```bash
yarn add fast-ternary-string-set
```

To use it without Node.js, you can simply copy the main source file (`src/index.ts`) into any TypeScript project, rename to something sensible, and then `import` it into your code as usual.

## Examples

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

Create a new string set from any `Iterable<string>`:

```js
// otherSet could be any Iterable<string>, such as a string array
// or even another TernaryStringSet
let otherSet = new Set(["fish", "hippo"]);
let set = new TernaryStringSet(otherSet);
set.has("hippo");
// => true
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

Get all elements that start with `"sha"`:

```js
set.getCompletionsOf("sha");
// => ["shade", "shadow", "shake", "shape", "shapes"] (for example)
```

Get all elements that can be made from the letters of `"taco"`:

```js
set.getArrangementsOf("taco");
// => ["act", "cat", "coat", "taco"] (for example)
```

Get all elements within Hamming distance 1 of `"cat"`:

```js
set.getWithinHammingDistanceOf("cat", 1);
// => ["bat", "can", "cap", "cat", "cot", "sat"] (for example)
```

Get all elements that match `"b.t"`:

```js
set.getPartialMatchesOf("b.t");
// => ["bat", "bet", "bit", "bot", "but"] (for example)
```

Compare sets:

```js
let s1 = new TernaryStringSet(["a", "b", "c"]);
let s2 = new TernaryStringSet(s1);
s1.equals(s2);
// => true
s1.isSubsetOf(s2);
// => true
s2.add("d");
s1.equals(s2);
// => false
s1.isSubsetOf(s2);
// => true
s1.isSupersetOf(s2);
// => false
```

Serialize to or from a buffer:

```js
// write a set to an ArrayBuffer
const buff = set.toBuffer();

// create a new set from a previously saved ArrayBuffer
const set = TernaryStringSet.fromBuffer(buff);
```

## Usage notes

### Differences from standard JS `Set`

`TernaryStringSet` supports a superset of the standard `Set` interface, but it is not a subclass of `Set`.

JavaScript `Set` objects guarantee that they iterate over elements in the order that they are added.
`TernaryStringSet`s always return results in sorted order.

`TernaryStringSet`s can contain the empty string, but cannot contain non-strings. Not even `null` or `undefined`.

### Tree quality

Adding strings in sorted order produces a worst-case tree structure. This can be avoided by adding strings all at once using the constructor or `addAll()`. Given sorted input, both of these methods will produce an optimal tree structure. If this is not practical, adding strings in random order usually yields a near-optimal tree. Calling `balance()` will rebuild the tree in optimal form, but it can be expensive.

Similarly, after deleting a large number of strings, future search performance may be improved by calling `balance()`.

Since most `TernaryStringSet` methods are recursive, extremely unbalanced trees can provoke "maximum call stack size exceeded" errors.

### Matching by code point

Some Unicode code points span two characters (char codes) in a JavaScript string. For example, the musical symbol 𝄞, code point U+1D11E, can be assigned to a JavaScript string as follows:

```js
const clefG = "\ud834\udd1e";
```

Even though it represents a single symbol, the above string has a length of two! To avoid surprises, `TernaryStringSet` matches by code point, not by char code. For example, since the above string is one code point, it would match `getPartialMatchesOf(".")` and not `getPartialMatchesOf("..")`.

### Compaction

Calling `compact()` can significantly reduce a set's memory footprint. For large sets of typical strings, typical results are a 50&ndash;80% reduction in size. However, no new strings can be added or deleted without undoing the compaction. Compaction is expensive, but can be a one-time or even ahead-of-time step for many use cases.

### Serialization

A common use case is to match user input against a fixed set of strings. For example, checking input against a spelling dictionary or suggesting completions for partial input. In such cases it is often desirable to build a set ahead of time, serialize it to a buffer, and then save the buffer data on a server where it can be downloaded as needed. Recreating a set directly from buffer data is much faster than downloading a file containing the strings and inserting them into a new set on the client.

The following steps will make such ahead-of-time sets as small as possible:

1. Create a set and insert the desired strings using `add()` or `addAll()`.
2. Minimize the tree size by calling `balance()` followed by `compact()`.
3. Create the buffer with `toBuffer()` and write the result to a file.
4. Optionally, compress the result and configure the server to serve the compressed version where supported by the browser.

To recreate the set, download or otherwise obtain the buffer data, then use `TernaryTreeSet.fromBuffer(data)`.

## Developing

Building from source requires Node.js. Clone the repository, then install development dependencies:

```bash
npm install
```

The TypeScript source is found under `src`. Compiled output is written to `lib`. To build the project:

```bash
npm run build
```

The included `tsconfig.json` targets ES2021. To target old JavaScript engines or browsers you will need to modify this configuration and/or use a tool like Babel.

The project includes an extensive suite of tests under `src/tests`. To run all tests:

```bash
npm test
```

Before submitting a pull request, format, lint, and run all tests:

```bash
npm run format
npm run lint
npm test
```