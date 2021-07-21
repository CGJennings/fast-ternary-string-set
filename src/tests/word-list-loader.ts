import { readFileSync } from "fs";
import { join } from "path";

/**
 * Given a `name`, loads a list of words from `name-list.txt` returning it as a string array.
 *
 * @param listName The short name of the word list file.
 * @returns An array in which each element is a word from the list.
 */
export function load(listName: string): string[] {
  return readFileSync(join(__dirname, `${listName}-list.txt`), "utf8").split(
    "\n",
  );
}
