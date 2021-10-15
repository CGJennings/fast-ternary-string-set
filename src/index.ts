/** Node index indicating that no node is present. */
const NUL = ~(1 << 31);
/** First node index that would run off of the end of the array. */
const NODE_CEILING = NUL - 3;
/** End-of-string flag: set on node values when that node also marks the end of a string. */
const EOW = 1 << 21;
/** Mask to extract the code point from a node value, ignoring flags. */
const CP_MASK = EOW - 1;
/** Smallest code point that requires a surrogate pair. */
const CP_MIN_SURROGATE = 0x10000;
/** Version number for the data buffer format. */
const BUFFER_VERSION = 1;
/** Magic number used by buffer data format. */
const BUFFER_MAGIC = 84;
/** Buffer format header size (4 bytes magic/properties + 4 bytes node count). */
const BUFFER_HEAD_SIZE = 8;

/**
 * A sorted string set that implements a superset of the standard JS `Set` interface.
 * Supports approximate matching and allows serialization to/from a binary format.
 *
 * The string set can store any valid Unicode string, including the empty
 * string, strings that include characters from the supplementary (or "astral")
 * planes, and so on. Strings with code points beyond last Unicode code point,
 * U+10FFFF, are *not* supported.
 *
 * Strings are stored using a *ternary search tree*, which has excellent performance
 * characteristics when properly constructed (it is important to avoid adding strings
 * in sorted order).
 */
export class TernaryStringSet implements Set<string>, Iterable<string> {
  /**
   * Tree data, an integer array laid out as follows:
   *
   * 1. `tree[n]`: code point of the character stored in this node, plus bit flags
   * 2. `tree[n+1]`: array index of the "less than" branch's child node
   * 3. `tree[n+2]`: array index of the "equal to" branch's child node
   * 4. `tree[n+3]`: array index of the "greater than" branch's child node
   *
   * Most modern JS engines optimize arrays that contain only 32-bit integers, meaning that
   * this structure usually offers better time/space performance than an equivalent tree
   * based on linked objects.
   */
  #tree: number[];
  /** Tracks whether empty string is in the set as a special case. */
  #hasEmpty: boolean;
  /** Tracks whether this tree has been compacted; if true this must be undone before mutating the tree. */
  #compact: boolean;
  /** Tracks set size. */
  #size: number;

  /**
   * Creates a new set. The set will be empty unless the optional iterable `source` object
   * is specified. If a `source` is provided, all of its elements will be added to the new set.
   * If `source` contains any element that would cause `add()` to throw an error, the constructor
   * will also throw an error for that element.
   *
   * **Note:** Since strings are iterable, passing a string to the constructor will create
   * a new set containing one string for each unique code point in the source string, and not
   * a singleton set containing just the source string as you might expect.
   *
   * @param source An optional iterable object whose strings will be added to the new set.
   */
  constructor(source?: Iterable<string>) {
    this.clear();

    if (source != null) {
      if (typeof source[Symbol.iterator] !== "function") {
        throw new TypeError("source object is not iterable");
      }
      if (source instanceof TernaryStringSet) {
        this.#tree = source.#tree.slice();
        this.#hasEmpty = source.#hasEmpty;
        this.#compact = source.#compact;
        this.#size = source.#size;
      } else if (Array.isArray(source)) {
        this.addAll(source);
      } else {
        this.addAll(Array.from(source));
      }
    }
  }

  /**
   * Returns the number of unique strings stored in this set.
   *
   * @returns The non-negative integer number of string elements in the set.
   */
  get size(): number {
    return this.#size;
  }

  /** Removes all strings from this set. */
  clear(): void {
    this.#tree = [];
    this.#hasEmpty = false;
    this.#compact = false;
    this.#size = 0;
  }

  /**
   * Adds a string to this set. The string can be empty, but cannot be null.
   * Adding an already present string has no effect.
   * If inserting multiple strings in sorted (lexicographic) order, prefer
   * `addAll` over this method.
   *
   * @param s The non-null string to add.
   * @returns This set, allowing chained calls.
   * @throws TypeError If the argument is not a string.
   */
  add(s: string): this {
    if (typeof s !== "string") {
      if (!((s as unknown) instanceof String)) {
        throw new TypeError("not a string: " + s);
      }
      s = String(s);
    }
    if (s.length === 0) {
      if (!this.#hasEmpty) {
        this.#hasEmpty = true;
        ++this.#size;
      }
    } else {
      if (this.#compact && !this.has(s)) this.__decompact();
      this.addImpl(0, s, 0, s.codePointAt(0));
    }
    return this;
  }

  private addImpl(node: number, s: string, i: number, cp: number): number {
    const tree = this.#tree;

    if (node >= tree.length) {
      node = tree.length;
      if (node >= NODE_CEILING) {
        throw new RangeError("cannot add more strings");
      }
      tree.push(cp, NUL, NUL, NUL);
    }

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      tree[node + 1] = this.addImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      tree[node + 3] = this.addImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        if ((tree[node] & EOW) === 0) {
          tree[node] |= EOW;
          ++this.#size;
        }
      } else {
        tree[node + 2] = this.addImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }

    return node;
  }

  /**
   * Adds an entire array, or subarray, of strings to this set.
   *
   * If the array is sorted in ascending order and no other strings have been
   * added to this set, the underlying tree is guaranteed to be balanced, ensuring
   * good search performance. If the array is in random order, the tree is *likely*
   * to be nearly balanced.
   *
   * @param strings The non-null array of strings to add.
   * @param start The index of the first element to add (inclusive, default is 0).
   * @param end The index of the last element to add (exclusive, default is `strings.length`)
   */
  addAll(strings: readonly string[], start = 0, end?: number): void {
    if (strings == null) throw new ReferenceError("null strings");
    if (end === undefined) end = strings.length;

    if (--end < start) return;

    // if the tree is empty and the list is sorted, this insertion
    // order ensures a balanced tree (inserting strings in sorted order
    // is a degenerate case)
    const mid = Math.floor(start + (end - start) / 2);
    this.add(strings[mid]);
    this.addAll(strings, start, mid);
    this.addAll(strings, mid + 1, end + 1);
  }

  /**
   * Returns whether this set contains the specified string. If passed a non-string value,
   * returns false.
   *
   * @param s The non-null string to test for.
   * @returns True if the string is present.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has(s: any): boolean {
    if (typeof s !== "string") {
      if (!(s instanceof String)) {
        return false;
      }
      s = String(s);
    }
    if (s.length === 0) return this.#hasEmpty;

    return this.hasImpl(0, s, 0, s.codePointAt(0));
  }

  private hasImpl(node: number, s: string, i: number, cp: number): boolean {
    const tree = this.#tree;

    if (node >= tree.length) return false;

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this.hasImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      return this.hasImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        return (tree[node] & EOW) === EOW;
      } else {
        return this.hasImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }
  }

  /**
   * Removes the specified string from this set, if it is present.
   * If it is not present, this has no effect.
   *
   * @param s The non-null string to delete.
   * @returns True if the string was in this set; false otherwise.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(s: any): boolean {
    if (typeof s !== "string") {
      if (!(s instanceof String)) {
        return false;
      }
      s = String(s);
    }
    if (s.length === 0) {
      const had = this.#hasEmpty;
      if (had) {
        this.#hasEmpty = false;
        --this.#size;
      }
      return had;
    }

    if (this.#compact && this.has(s)) this.__decompact();
    return this.deleteImpl(0, s, 0, s.codePointAt(0));
  }

  private deleteImpl(node: number, s: string, i: number, cp: number): boolean {
    const tree = this.#tree;

    if (node >= tree.length) return false;

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this.deleteImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      return this.deleteImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        const had = (tree[node] & EOW) === EOW;
        if (had) {
          tree[node] &= CP_MASK;
          --this.#size;
        }
        return had;
      } else {
        return this.deleteImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }
  }

  /**
   * Returns all strings in this set that can be composed from combinations of the characters
   * in the specified string. Unlike an anagram, not all pattern characters need to appear for a match
   * to count. For example, the pattern `"coat"` can match `"cat"` even though the *o* is not used.
   * However, characters cannot appear *more often* than they appear in the pattern string. The same
   * pattern `"coat"` cannot match `"tot"` since it includes only a single *t*.
   *
   * If this set contains the empty string, it is always included in results from this
   * method.
   *
   * @param charPattern The non-null pattern string.
   * @returns A (possibly empty) array of strings from the set that can be composed from the
   *     pattern characters.
   */
  getArrangementsOf(charPattern: string): string[] {
    if (charPattern == null) throw new ReferenceError("null charPattern");
    charPattern = String(charPattern);

    // availChars[codePoint] = how many times codePoint appears in pattern
    const availChars: number[] = [];
    for (let i = 0; i < charPattern.length; ) {
      const cp = charPattern.codePointAt(i++);
      if (cp >= CP_MIN_SURROGATE) ++i;
      availChars[cp] = availChars[cp] ? availChars[cp] + 1 : 1;
    }

    const matches: string[] = this.#hasEmpty ? [""] : [];
    this.getArrangementsOfImpl(0, availChars, [], matches);
    return matches;
  }

  private getArrangementsOfImpl(
    node: number,
    availChars: number[],
    prefix: number[],
    matches: string[],
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return;

    this.getArrangementsOfImpl(tree[node + 1], availChars, prefix, matches);

    const cp = tree[node] & CP_MASK;
    if (availChars[cp] > 0) {
      --availChars[cp];
      prefix.push(cp);
      if (tree[node] & EOW) {
        matches.push(String.fromCharCode(...prefix));
      }
      this.getArrangementsOfImpl(tree[node + 2], availChars, prefix, matches);
      prefix.pop();
      ++availChars[cp];
    }

    this.getArrangementsOfImpl(tree[node + 3], availChars, prefix, matches);
  }

  /**
   * Returns an array of possible completions for the specified pattern string.
   * That is, an array of all strings in the set that start with the pattern.
   * If the pattern itself is in the set, it is included as the first entry.
   *
   * @param pattern The non-null pattern to find completions for.
   * @returns A (possibly empty) array of all strings in the set for which the
   *     pattern is a prefix.
   */
  getCompletionsOf(pattern: string): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");

    pattern = String(pattern);

    if (pattern.length === 0) {
      return Array.from(this);
    }

    const results: string[] = [];
    const prefix = this.__cp(pattern);
    let node = this.__has(0, prefix, 0);
    if (node < 0) {
      node = -node - 1;
      // prefix not in tree, therefore no children are either
      if (node >= this.#tree.length) {
        return results;
      }
      // prefix in tree, but is not itself in the set
    } else {
      // prefix in tree, and also in set
      results.push(String.fromCodePoint(...prefix));
    }

    // continue from end of prefix by taking equal branch
    this.__visit(this.#tree[node + 2], prefix, (s) => {
      results.push(String.fromCodePoint(...s));
    });
    return results;
  }

  /**
   * Returns all strings that match the pattern. The pattern may include zero or
   * more "don't care" characters that can match any code point. By default this
   * character is `"."`, but any valid code point can be used. For example, the
   * pattern `"c.t"` would match any of `"cat"`, `"cot"`, or `"cut"`, but not `"cup"`.
   *
   * @param pattern A pattern string matched against the strings in the set.
   * @param dontCareChar The character that can stand in for any character in the pattern.
   *     Only the first code point is used. (Default is `"."`.)
   * @returns A (possibly empty) array of strings that match the pattern string.
   */
  getPartialMatchesOf(pattern: string, dontCareChar = "."): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");
    if (dontCareChar == null) throw new ReferenceError("null dontCareChar");

    pattern = String(pattern);
    dontCareChar = String(dontCareChar);

    if (dontCareChar.length === 0) throw new TypeError("empty dontCareChar");

    if (pattern.length === 0) {
      return this.#hasEmpty ? [""] : [];
    }

    const dc = dontCareChar.codePointAt(0);
    const matches: string[] = [];
    this.getPartialMatchesOfImpl(0, pattern, 0, dc, [], matches);
    return matches;
  }

  private getPartialMatchesOfImpl(
    node: number,
    pattern: string,
    i: number,
    dc: number,
    prefix: number[],
    matches: string[],
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return;

    const cp = pattern.codePointAt(i);
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp || cp === dc) {
      this.getPartialMatchesOfImpl(
        tree[node + 1],
        pattern,
        i,
        dc,
        prefix,
        matches,
      );
    }
    if (cp === treeCp || cp === dc) {
      const i_ = i + (cp >= CP_MIN_SURROGATE ? 2 : 1);
      prefix.push(treeCp);
      if (i_ >= pattern.length) {
        if (tree[node] & EOW) {
          matches.push(String.fromCodePoint(...prefix));
        }
      } else {
        this.getPartialMatchesOfImpl(
          tree[node + 2],
          pattern,
          i_,
          dc,
          prefix,
          matches,
        );
      }
      prefix.pop();
    }
    if (cp > treeCp || cp === dc) {
      this.getPartialMatchesOfImpl(
        tree[node + 3],
        pattern,
        i,
        dc,
        prefix,
        matches,
      );
    }
  }

  /**
   * Returns an array of all strings in the set that are within the specified Hamming distance
   * of the given pattern string. A string is within Hamming distance *n* of the pattern if at
   * most *n* of its code points are different from those of the pattern. For example:
   *  - `cat` is Hamming distance 0 from itself;
   *  - `cot` is Hamming distance 1 from `cat`;
   *  - `cop` is Hamming distance 2 from `cat`; and
   *  - `top` is Hamming distance 3 from `cat`.
   *
   * @param pattern A pattern string matched against the strings in the set.
   * @param distance The maximum number of code point deviations to allow from the pattern string.
   * @returns A (possibly empty) array of strings from the set that match the pattern.
   */
  getWithinHammingDistanceOf(pattern: string, distance: number): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");

    pattern = String(pattern);
    distance = Math.max(0, Math.floor(Number(distance)));
    if (distance !== distance) throw new TypeError("distance must be a number");

    // only the string itself is within distance 0 or matches empty pattern
    if (distance < 1 || pattern.length === 0) {
      return this.has(pattern) ? [pattern] : [];
    }

    const matches: string[] = [];

    // optimize cases where any string the same length as the pattern will match
    if (distance >= pattern.length) {
      this.__visit(0, [], (prefix) => {
        if (prefix.length === pattern.length) {
          matches.push(String.fromCodePoint(...prefix));
        }
      });
      return matches;
    }

    this.getWithinHammingDistanceOfImpl(0, pattern, 0, distance, [], matches);
    return matches;
  }

  private getWithinHammingDistanceOfImpl(
    node: number,
    pattern: string,
    i: number,
    dist: number,
    prefix: number[],
    matches: string[],
  ) {
    const tree = this.#tree;
    if (node >= tree.length || dist < 0) return;

    const cp = pattern.codePointAt(i);
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp || dist > 0) {
      this.getWithinHammingDistanceOfImpl(
        tree[node + 1],
        pattern,
        i,
        dist,
        prefix,
        matches,
      );
    }

    prefix.push(treeCp);
    if (tree[node] & EOW && pattern.length === prefix.length) {
      if (dist > 0 || cp === treeCp) {
        matches.push(String.fromCodePoint(...prefix));
      }
      // no need to recurse, children of this equals branch are too long
    } else {
      const i_ = i + (cp >= CP_MIN_SURROGATE ? 2 : 1);
      const dist_ = dist - (cp === treeCp ? 0 : 1);
      this.getWithinHammingDistanceOfImpl(
        tree[node + 2],
        pattern,
        i_,
        dist_,
        prefix,
        matches,
      );
    }
    prefix.pop();

    if (cp > treeCp || dist > 0) {
      this.getWithinHammingDistanceOfImpl(
        tree[node + 3],
        pattern,
        i,
        dist,
        prefix,
        matches,
      );
    }
  }

  /**
   * Calls the specified callback function once for each string in this set, passing the string
   * and this set. The string is passed as both value and key to align with `Map.forEach`.
   * If `thisArg` is specified, it is used as `this` when invoking the callback function.
   *
   * @param callbackFn The function to call for each string.
   * @param thisArg Optional value to use as `this` when calling the function.
   */
  forEach(
    callbackFn: (value: string, key: string, set: TernaryStringSet) => void,
    thisArg?: unknown,
  ): void {
    let thiz: unknown;
    if (arguments.length >= 2) thiz = thisArg;

    this.__visit(0, [], (prefix) => {
      const s = String.fromCodePoint(...prefix);
      callbackFn.call(thiz, s, s, this);
    });
  }

  /**
   * Returns an iterator over the strings in this set.
   * This is included for compatibilty with Sets and Maps; it is equivalent to `values()`.
   *
   * **Note:** Unlike standard `Set`s, this set's values are returned in ascending
   * lexicographic order, *not* the order in which items were added.
   *
   * @returns An non-null iterator over the strings in this set.
   */
  keys(): IterableIterator<string> {
    return this.values();
  }

  /**
   * Returns an iterator over the strings in this set.
   *
   * **Note:** Unlike standard `Set`s, this set's values are returned in ascending
   * lexicographic order, *not* the order in which items were added.
   *
   * @returns An non-null iterator over the strings in this set.
   */
  values(): IterableIterator<string> {
    const tree = this.#tree;
    function* itor(node: number, prefix: number[]): Generator<string> {
      if (node < 0) {
        node = 0;
        yield "";
      }
      if (node >= tree.length) return;
      yield* itor(tree[node + 1], prefix);
      prefix.push(tree[node] & CP_MASK);
      if (tree[node] & EOW) yield String.fromCodePoint(...prefix);
      yield* itor(tree[node + 2], prefix);
      prefix.pop();
      yield* itor(tree[node + 3], prefix);
    }
    return itor(this.#hasEmpty ? -1 : 0, []);
  }

  /**
   * Returns an iterator over the entries in this set, for compatibility with Map objects.
   * The result is the same as that of `values()` except that each string is wrapped in
   * an array and repeated twice.
   *
   * **Note:** Unlike standard `Set`s, this set's values are returned in ascending
   * lexicographic order, *not* the order in which items were added.
   *
   * @returns An iterator over the key-value pairs in this set,
   *     with each value acting as its own key.
   */
  entries(): IterableIterator<[string, string]> {
    const it = this.values();
    return (function* (): IterableIterator<[string, string]> {
      let next = it.next();
      while (!next.done) {
        yield [next.value, next.value];
        next = it.next();
      }
    })();
  }

  /**
   * Returns whether this set contains exactly the same elements as the specified set.
   * If passed an object that is not a `TernaryTreeSet`, this method returns false.
   *
   * @param rhs The set (or other object) to compare this set to.
   * @returns True if the specified object is also a `TernaryTreeSet` and it contains the same elements.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equals(rhs: any): boolean {
    if (!(rhs instanceof TernaryStringSet)) return false;
    if (this.#size !== rhs.#size) return false;
    return this.isSubsetOf(rhs);
  }

  /**
   * Returns whether this set is a subset of the specified set. This set is a subset if every
   * element in this set is also contained in the other set. By this definition,
   * equal sets are also subsets of each other. To test if this set is a *proper* subset
   * of the specified set, use code like this: `lhs.size < rhs.size && lhs.isSubsetOf(rhs)`.
   *
   * @param rhs The set to compare this set to.
   * @returns True if this set is a subset of, or equal to, the specified set.
   */
  isSubsetOf(rhs: TernaryStringSet): boolean {
    if (this === rhs) return true;
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    if (this.#size > rhs.#size) return false;
    if (this.#hasEmpty && !rhs.#hasEmpty) return false;

    // What follows is a faster equivalent to the following code:
    // ```
    // for (const s of this) {
    //   if (!rhs.has(s)) return false;
    // }
    // return true;
    // ```

    let subset = true;
    this.__visit(0, [], (s) => {
      if (rhs.__has(0, s, 0) < 0) {
        subset = false;
        return false;
      }
    });
    return subset;
  }

  /**
   * Returns whether this set is a superset of the specified set. This set is a superset if every
   * element in the other set is also contained in this set. By this definition,
   * equal sets are also supersets of each other. To test if this set is a *proper* superset
   * of the specified set, use code like this: `lhs.size > rhs.size && lhs.isSupersetOf(rhs)`.
   *
   * @param rhs The set to compare this set to.
   * @returns True if this set is a superset of, or equal to, the specified set.
   */
  isSupersetOf(rhs: TernaryStringSet): boolean {
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    return rhs.isSubsetOf(this);
  }

  /**
   * Returns a new set that is the union of this set and the specified set.
   * The new set will include any element that is a member of either set.
   *
   * @param rhs The set to form a union with.
   * @returns A new set containing the elements of both sets.
   */
  union(rhs: TernaryStringSet): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    if (rhs.#size > this.#size) {
      return rhs.union(this);
    }
    const union = this.__noncompactClone();
    if (!union.#hasEmpty && rhs.#hasEmpty) {
      union.#hasEmpty = true;
      ++union.#size;
    }
    rhs.__visit(0, [], (s) => {
      union.__add(0, s, 0);
    });
    return union;
  }

  /**
   * Returns a new set that is the intersection of this set and the specified set.
   * The new set will include only those elements that are members of both sets.
   *
   * @param rhs The set to intersect with this set.
   * @returns A new set containing only elements in both sets.
   */
  intersection(rhs: TernaryStringSet): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    if (rhs.#size < this.#size) {
      return rhs.intersection(this);
    }
    const intersect = this.__noncompactClone();
    if (intersect.#hasEmpty && !rhs.#hasEmpty) {
      intersect.#hasEmpty = false;
      --intersect.#size;
    }
    intersect.#hasEmpty &&= rhs.#hasEmpty;
    intersect.__visit(0, [], (s, node) => {
      // delete if not also in rhs
      if (rhs.__has(0, s, 0) < 0) {
        intersect.#tree[node] &= CP_MASK;
        --intersect.#size;
      }
    });
    return intersect;
  }

  /**
   * Returns a new set that is the difference of this set and the specified set.
   * The new set will include all of the elements of this set *except* for those
   * in the specified set.
   *
   * @param rhs The set to subtract from this set.
   * @returns A new set containing only those elements in this set that are not
   *   in the specified set.
   */
  subtract(rhs: TernaryStringSet): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    const diff = this.__noncompactClone();
    if (rhs.#hasEmpty && diff.#hasEmpty) {
      diff.#hasEmpty = false;
      --diff.#size;
    }
    diff.__visit(0, [], (s, node) => {
      // delete if in rhs
      if (rhs.__has(0, s, 0) >= 0) {
        diff.#tree[node] &= CP_MASK;
        --diff.#size;
      }
    });
    return diff;
  }

  /**
   * Returns a new set that is the symmetric difference of this set and the specified set.
   * The new set will include all of the elements that are either set, but not in *both* sets.
   *
   * @param rhs The set to take the symmetric difference of from this set.
   * @returns A new set containing only those elements in this set or the specified set,
   *   but not both.
   */
  symmetricDifference(rhs: TernaryStringSet): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    const diff = this.__noncompactClone();
    diff.#hasEmpty = this.#hasEmpty !== rhs.#hasEmpty;
    if (this.#hasEmpty !== diff.#hasEmpty) {
      if (diff.#hasEmpty) {
        ++diff.#size;
      } else {
        --diff.#size;
      }
    }
    rhs.__visit(0, [], (s) => {
      // if s is also in diff, delete in diff; otherwise add to diff
      const node = diff.__has(0, s, 0);
      if (node >= 0) {
        diff.#tree[node] &= CP_MASK;
        --diff.#size;
      } else {
        diff.__add(0, s, 0);
      }
    });
    return diff;
  }

  /**
   * Returns an iterator over the strings in this set, in ascending lexicographic order.
   * As a result, this set can be used in `for...of` loops and other contexts that
   * expect iterable objects.
   *
   * @returns An non-null iterator over the strings in this set.
   */
  [Symbol.iterator](): IterableIterator<string> {
    return this.values();
  }

  /**
   * Returns the string tag used by `Object.prototype.toString()` for this class.
   */
  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }

  /**
   * A private helper method that calls a function for each string in the
   * subtree rooted at the specified node index. Strings are passed to
   * the function as an array of code points. Thus the string
   * `"ABC"` would be passed as `[65, 66, 67]`. If the function
   * returns `false`, tree traversal ends immediately.
   *
   * Does not visit the empty string.
   *
   * @param node The starting node index (0 for tree root).
   * @param prefix The array to have string code points appended to it.
   * @param visitFn The function to invoke for each string.
   */
  private __visit(
    node: number,
    prefix: number[],
    visitFn: (prefix: number[], node: number) => void | boolean,
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return;
    this.__visit(tree[node + 1], prefix, visitFn);
    prefix.push(tree[node] & CP_MASK);
    if (tree[node] & EOW) {
      if (visitFn(prefix, node) === false) return;
    }
    this.__visit(tree[node + 2], prefix, visitFn);
    prefix.pop();
    this.__visit(tree[node + 3], prefix, visitFn);
  }

  /**
   * Private helper method similar to `has()`, but it searches for a string specified
   * as an array of code points. If the string is found, the node index of the node
   * where the string ends is returned. If the string is not found, a negative number
   * is returned that is one less than the node where the search failed. To convert
   * this to the node where the search failed, use `-node - 1`. If this node is past
   * the last node in the tree, then the specified string is not in the tree at all.
   * Otherwise, the specified string is a prefix of other strings in the set but
   * is not itself in the set.
   *
   * Does not handle testing for the empty string.
   *
   * @param node The subtree from which to begin searching.
   * @param s The array of code points to search for.
   * @param i The index of the code point currently being searched for.
   * @returns The node index where the string ends, or a negative value indicating the node
   *     where searching failed, as described above.
   */
  private __has(node: number, s: number[], i: number): number {
    const tree = this.#tree;
    if (node >= tree.length) return -node - 1;

    const cp = s[i];
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this.__has(tree[node + 1], s, i);
    } else if (cp > treeCp) {
      return this.__has(tree[node + 3], s, i);
    } else {
      if (++i >= s.length) {
        return (tree[node] & EOW) === EOW ? node : -node - 1;
      } else {
        return this.__has(tree[node + 2], s, i);
      }
    }
  }

  /**
   * Private helper method similar to `add()`, but it takes a string specified
   * as an array of code points.
   *
   * Does not handle adding empty strings.
   *
   * @param node The subtree from which to begin adding.
   * @param s The array of code points to add for.
   * @param i The index of the code point currently being added.
   */
  private __add(node: number, s: number[], i: number): number {
    const tree = this.#tree;
    const cp = s[i];

    if (node >= tree.length) {
      node = tree.length;
      if (node >= NODE_CEILING) {
        throw new RangeError("cannot add more strings");
      }
      tree.push(cp, NUL, NUL, NUL);
    }

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      tree[node + 1] = this.__add(tree[node + 1], s, i);
    } else if (cp > treeCp) {
      tree[node + 3] = this.__add(tree[node + 3], s, i);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        if ((tree[node] & EOW) === 0) {
          tree[node] |= EOW;
          ++this.#size;
        }
      } else {
        tree[node + 2] = this.__add(tree[node + 2], s, i);
      }
    }

    return node;
  }

  /**
   * Private helper method that returns a string as an array of numeric code points.
   * (This is not equivalent to `[...s]`, which returns strings.)
   *
   * @param s The string to conver.
   * @returns An array of the code points that comprise the string.
   */
  private __cp(s: string): number[] {
    const cps = [];
    for (let i = 0; i < s.length; ) {
      const cp = s.codePointAt(i++);
      if (cp >= CP_MIN_SURROGATE) ++i;
      cps.push(cp);
    }
    return cps;
  }

  /**
   * Private helper that converts a compact tree back into a non-compact form.
   */
  private __decompact() {
    if (this.#compact) this.balance();
  }

  /**
   * Private helper method that returns a clone of this set; but unlike using
   * the constructor to copy a set, the new set is guaranteed not to be compact.
   */
  private __noncompactClone() {
    if (this.#compact) {
      return new TernaryStringSet(Array.from(this));
    } else {
      return new TernaryStringSet(this);
    }
  }

  /**
   * Compacts the set to reduce memory use and improve search performance.
   * For large sets, a compacted set is typically *significantly* smaller
   * than an uncompacted set. The tradeoff is that compact sets cannot be modified.
   * Any method that mutates the set, including
   * `add`, `addAll`, `balance`, and `delete`
   * can therefore cause the set to revert to an uncompacted state.
   *
   * Compaction and uncompaction are expensive operations, so rapid cycling
   * between these states should be avoided. Compaction is an excellent option
   * if the primary purpose of a set matching against a fixed collection
   * of strings, such as a dictionary.
   */
  compact(): void {
    if (this.#compact || this.#tree.length === 0) return;

    // Theory of operation:
    //
    // In a ternary tree, all strings with the same prefix share the nodes
    // that make up that prefix. The compact operation does much the same thing,
    // but for suffixes. It does this by deduplicating identical tree nodes.
    // For example, every string that ends in "e" and is not a prefix of any other
    // string looks the same: an "e" node with three NUL pointers for its child branches.
    // But these can be distributed throughout the tree. Consider a tree containing only
    // "ape" and "haze": we could save space by having only a single copy of the "e" node
    // and pointing to it from both the "p" node and the "z" node.
    //
    // To compact the tree, we iterate over each node in turn. If this is the first time
    // we have seen this node, we assign it to the next available slot in the new,
    // compacted array we will be create. If we have already seen the equivalent node,
    // we do not assign it a slot since it will share the previously assigned slot.
    // We then write out the new tree by iterating over the deduplicated nodes. When
    // writing a node's child branch pointers, instead of using the original pointers
    // we look up the new slot assigned to each child in the previous step.
    //
    // After performing the above step once, we will only have deduplicated the leaf nodes
    // (because initially the only pointer that appears in multiple nodes is the NUL pointer).
    // However, because the parents of those leaf nodes are now sharing pointers where they
    // point to a deduplicated leaf node, there may now be duplicates among the parent nodes.
    // Thus we can repeat the process above to dedupe the parent nodes. This may create
    // duplicates in those parent nodes, and so on. The rewriting process can be repeated until
    // the new array doesn't get any smaller, at which point there are no more duplicates.
    //

    let source = this.#tree;
    for (;;) {
      const compacted = compactionPass(source);
      if (compacted.length === source.length) {
        this.#tree = compacted;
        break;
      }
      source = compacted;
    }
    this.#compact = true;
  }

  /**
   * Optimizes the layout of the underlying data structure to maximize search speed.
   * This may improve future search performance after adding or deleting a large
   * number of strings.
   *
   * It is not normally necessary to call this method as long as care was taken not
   * to add large numbers of words in lexicographic order. That said, two scenarios
   * where it may be particularly effective are:
   *  - If the set will be used in phases, with strings being added in one phase
   *    followed by a phase of extensive search operations.
   *  - If the string is about to be converted into a buffer for future use.
   *
   * As detailed under `addAll`, if the entire contents of the set were added by a single
   * call to `addAll` using a sorted array, the tree is already balanced and calling this
   * method will have no benefit.
   *
   * **Note:** This method undoes the effect of `compact()`. If you want to balance and
   * compact the tree, be sure to balance it first.
   */
  balance(): void {
    this.#tree = new TernaryStringSet(Array.from(this)).#tree;
    this.#compact = false;
  }

  /**
   * Returns a buffer whose contents can be used to recreate this set.
   * The returned data is independent of the platform on which it is created.
   *
   * @returns A non-null buffer.
   */
  toBuffer(): ArrayBuffer {
    const tree = this.#tree;

    // allocate space for header + node count + tree nodes
    const buffer = new ArrayBuffer(BUFFER_HEAD_SIZE + this.#tree.length * 4);
    const view = new DataView(buffer);
    // first two bytes are magic "TT" for ternary tree
    view.setUint8(0, BUFFER_MAGIC);
    view.setUint8(1, BUFFER_MAGIC);
    // third byte is version number
    view.setUint8(2, BUFFER_VERSION);
    // fourth byte tracks presence of empty string
    view.setUint8(3, this.#hasEmpty ? 1 : 0);

    // fifth though eigth bytes store number of nodes as a check
    view.setUint32(4, tree.length, false);

    // remainder of buffer stores tree content
    for (let i = 0, byte = BUFFER_HEAD_SIZE; i < tree.length; ++i, byte += 4) {
      view.setUint32(byte, tree[i], false);
    }

    return buffer;
  }

  /**
   * Creates a new string set from data in a buffer previously created with `toBuffer`.
   *
   * @param buffer The buffer to recreate the set from.
   * @returns A new set that recreates the original set that was stored in the buffer.
   * @throws `ReferenceError` If the specified buffer is null.
   * @throws `TypeError` If the buffer data is invalid or from an unsupported version.
   */
  static fromBuffer(buffer: ArrayBuffer): TernaryStringSet {
    if (buffer == null) {
      throw new ReferenceError("null buffer");
    }

    const view = new DataView(buffer);

    // verify that this appears to be valid tree data
    // and that the version of the format is supported
    if ((view.byteLength & 3) !== 0) {
      throw new TypeError("bad buffer (length)");
    }
    if (view.getUint8(0) !== BUFFER_MAGIC || view.getInt8(1) !== BUFFER_MAGIC) {
      throw new TypeError("bad buffer (magic bytes)");
    }
    if (view.getUint8(2) < 1) {
      throw new TypeError("bad buffer (version byte)");
    }
    if (view.getUint8(2) > BUFFER_VERSION) {
      throw new TypeError(
        `unsupported version: ${view.getInt8(2)} > ${BUFFER_VERSION}`,
      );
    }

    const treeFlags = view.getUint8(3);
    if (treeFlags > 1) {
      throw new TypeError("bad buffer (invalid tree properties)");
    }

    const expectedLength = BUFFER_HEAD_SIZE + view.getUint32(4, false) * 4;
    if (view.byteLength < expectedLength) {
      throw new TypeError("bad buffer (missing bytes)");
    }

    const newTree = new TernaryStringSet();
    newTree.#hasEmpty = (treeFlags & 1) === 1;
    const tree = newTree.#tree;
    for (let byte = BUFFER_HEAD_SIZE; byte < view.byteLength; byte += 4) {
      tree[tree.length] = view.getUint32(byte, false);
    }

    let size = newTree.#hasEmpty ? 1 : 0;
    for (let node = 0; node < tree.length; node += 4) {
      if (tree[node] & EOW) ++size;
    }
    newTree.#size = size;

    return newTree;
  }

  /**
   * Returns information about this set's underlying tree structure.
   * This method is intended only for advanced use cases, such as
   * testing, estimating the set's memory footprint or deciding
   * whether to rebalance the tree.
   */
  get stats(): TernaryTreeStats {
    const tree = this.#tree;
    const breadth: number[] = [];
    const nodes = this.#tree.length / 4;
    let surrogates = 0;
    let minCodePoint = nodes > 0 ? 0x10ffff : 0;
    let maxCodePoint = 0;

    (function traverse(n: number, d: number) {
      if (n >= tree.length) return;

      breadth[d] = breadth.length <= d ? 1 : breadth[d] + 1;

      const cp = tree[n] & CP_MASK;
      if (cp >= CP_MIN_SURROGATE) ++surrogates;
      if (cp > maxCodePoint) maxCodePoint = cp;
      if (cp < minCodePoint) minCodePoint = cp;

      traverse(tree[n + 1], d + 1);
      traverse(tree[n + 2], d + 1);
      traverse(tree[n + 3], d + 1);
    })(0, 0);

    return {
      size: this.#size,
      nodes,
      compact: this.#compact,
      depth: breadth.length,
      breadth,
      minCodePoint,
      maxCodePoint,
      surrogates,
      toString() {
        return JSON.stringify(this)
          .replace(/\{|\}/g, "")
          .replace(/"(\w+)":/g, "\n$1: ");
      },
    };
  }
}

/** Tree structure information obtained by reading the `stats` property. */
export interface TernaryTreeStats {
  /** The number of strings in the tree. Equivalent to the `size` property. */
  size: number;
  /**
   * The total number of nodes in the tree. For a high-quality JavaScript engine, the
   * set will consume approximately `nodes * 16` bytes of memory, plus some object overhead.
   */
  nodes: number;
  /** True if the tree structure is compacted. */
  compact: boolean;
  /** The maximum depth (height) of the tree. */
  depth: number;
  /**
   * Width of the tree at each level of tree depth, starting with the root at `breadth[0]`.
   * A deep tree with small depth values will benefit most from being balanced.
   */
  breadth: number[];
  /** The least code point contained in any string in the set. */
  minCodePoint: number;
  /** The greatest code point contained in any string in the set. */
  maxCodePoint: number;
  /** The total number of nodes whose code point spans multiple char codes when stored in a string. */
  surrogates: number;
  /** Returns the stats in string form. */
  toString(): string;
}

/** Performs a single compaction pass; see `compact()` method. */
function compactionPass(tree: number[]): number[] {
  // this uses nested sparse arrays to map node values to slots
  // mapping(index of node in #tree) => index ("slot") of node in the compacted output
  let nextSlot = 0;
  const nodeMap: number[][][][] = [];
  function mapping(i: number): number {
    // nodeMap[value][ltPointer][eqPointer][gtPointer] = slot
    let ltMap = nodeMap[tree[i]];
    if (ltMap == null) {
      nodeMap[tree[i]] = ltMap = [];
    }
    let eqMap = ltMap[tree[i + 1]];
    if (eqMap == null) {
      ltMap[tree[i + 1]] = eqMap = [];
    }
    let gtMap = eqMap[tree[i + 2]];
    if (gtMap == null) {
      eqMap[tree[i + 2]] = gtMap = [];
    }
    let slot = gtMap[tree[i + 3]];
    if (slot == null) {
      gtMap[tree[i + 3]] = slot = nextSlot;
      nextSlot += 4;
    }
    return slot;
  }

  // create map of unique nodes
  for (let i = 0; i < tree.length; i += 4) {
    mapping(i);
  }

  // rewrite tree
  const out: number[] = [];
  for (let i = 0; i < tree.length; i += 4) {
    const slot = mapping(i);
    // if the unique version of the node hasn't been written yet,
    // append it to the output array
    if (slot >= out.length) {
      if (slot > out.length) throw new Error("assertion");
      // write the node value unchanged
      out[slot] = tree[i];
      // write the pointers for each child branch, but use the new
      // slot for whatever child node is found there
      out[slot + 1] = mapping(tree[i + 1]);
      out[slot + 2] = mapping(tree[i + 2]);
      out[slot + 3] = mapping(tree[i + 3]);
    }
  }

  return out;
}
