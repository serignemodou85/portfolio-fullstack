import { signal } from '@angular/core';
import { byDate, byText, tableState } from './table-state';

interface Row {
  name: string;
  date: string;
}

const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ name: `Item ${String(i + 1).padStart(2, '0')}`, date: `2025-01-${String(i + 1).padStart(2, '0')}` }));

const makeTable = (items = signal(rows(12))) =>
  tableState<Row, 'name_asc' | 'date_desc'>(items, {
    sort: 'name_asc',
    searchIn: r => [r.name],
    compare: sort => (sort === 'name_asc' ? byText<Row>(r => r.name) : byDate<Row>(r => r.date)),
  });

describe('tableState', () => {
  it('pagine selon la taille de page', () => {
    const table = makeTable();
    expect(table.totalPages()).toBe(3);
    expect(table.paged().length).toBe(5);
    table.setPage(3);
    expect(table.paged().map(r => r.name)).toEqual(['Item 11', 'Item 12']);
  });

  it('borne la page demandée', () => {
    const table = makeTable();
    table.setPage(99);
    expect(table.page()).toBe(3);
    table.setPage(-2);
    expect(table.page()).toBe(1);
  });

  it('filtre par recherche, sans tenir compte de la casse', () => {
    const table = makeTable();
    table.query.set('ITEM 1');
    expect(table.processed().map(r => r.name)).toEqual(['Item 10', 'Item 11', 'Item 12']);
  });

  it('trie selon la clé choisie', () => {
    const table = makeTable();
    table.sort.set('date_desc');
    expect(table.processed()[0].name).toBe('Item 12');
  });

  it('revient sur la dernière page valide quand la liste rétrécit', () => {
    const items = signal(rows(12));
    const table = makeTable(items);
    table.setPage(3);
    items.set(rows(6));
    expect(table.page()).toBe(2);
    expect(table.paged().length).toBe(1);
  });
});
