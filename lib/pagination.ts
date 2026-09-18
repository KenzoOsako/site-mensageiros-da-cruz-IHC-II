/** Supply a fresh query with a unique, stable order for every page. */
export async function allRows<T>(query: () => { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }> }): Promise<T[]> {
  const rows: T[] = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const result = await query().range(offset, offset + size - 1);
    if (result.error) throw new Error('Não foi possível carregar todos os registros.');
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < size) return rows;
  }
}
