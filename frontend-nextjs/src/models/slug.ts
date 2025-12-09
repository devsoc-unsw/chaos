export function createProperSlug(input: string): string {
  let result = "";
  let lastCharWasHyphen = false;

  for (const c of input) {
    if (/[A-Za-z0-9]/.test(c)) {
      result += c;
      lastCharWasHyphen = false;
    } else {
      if (!lastCharWasHyphen) {
        result += "-";
        lastCharWasHyphen = true;
      }
    }
  }

  // Remove leading and trailing hyphens, then lowercase
  return result.replace(/^-+/, "").replace(/-+$/, "").toLowerCase();
}