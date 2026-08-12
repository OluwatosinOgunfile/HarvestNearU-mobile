export function titleCase(value: string) {
  return value.trim().toLocaleLowerCase('en-NG').replace(/(^|[\s\-/])([\p{L}\p{N}])/gu, (_, separator: string, character: string) => `${separator}${character.toLocaleUpperCase('en-NG')}`);
}
