/** Current Brasília civil time is UTC−03:00; validate calendar values, not just syntax. */
export function encodeBrasilia(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Data inválida.');
  const encoded = `${value}:00-03:00`;
  const date = new Date(encoded);
  if (!Number.isFinite(date.getTime()) || decodeBrasilia(encoded) !== value) throw new Error('Data inválida.');
  return encoded;
}
export function decodeBrasilia(value: string): string {
  return new Date(new Date(value).getTime() - 3 * 3600000).toISOString().slice(0, 16);
}
