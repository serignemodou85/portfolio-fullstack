import { Signal, computed, signal } from '@angular/core';

export interface TableOptions<T, S extends string> {
  /** Tri initial. */
  sort: S;
  /** Comparateur pour une clé de tri donnée. */
  compare: (sort: S) => (a: T, b: T) => number;
  /** Champs dans lesquels la recherche plein texte s'applique. */
  searchIn: (item: T) => (string | number | null | undefined)[];
  /** Filtre supplémentaire (type, statut...), appliqué avant la recherche. */
  filter?: (item: T) => boolean;
  pageSize?: number;
}

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/**
 * État d'un tableau admin (recherche, tri, pagination) dérivé d'une liste en signal.
 * La page courante est toujours ramenée dans les bornes : supprimer le dernier élément
 * d'une page renvoie simplement sur la précédente.
 */
export function tableState<T, S extends string>(items: Signal<T[]>, options: TableOptions<T, S>) {
  const query = signal('');
  const sort = signal<S>(options.sort);
  const pageSize = signal(options.pageSize ?? 5);
  const requestedPage = signal(1);

  const processed = computed(() => {
    const q = query().trim().toLowerCase();
    let list = options.filter ? items().filter(options.filter) : items();
    if (q) {
      list = list.filter(item =>
        options.searchIn(item).some(value => value != null && String(value).toLowerCase().includes(q))
      );
    }
    return [...list].sort(options.compare(sort()));
  });

  const totalPages = computed(() => Math.max(1, Math.ceil(processed().length / pageSize())));
  const page = computed(() => Math.min(Math.max(requestedPage(), 1), totalPages()));
  const paged = computed(() => processed().slice((page() - 1) * pageSize(), page() * pageSize()));

  return {
    query,
    sort,
    pageSize,
    page,
    totalPages,
    processed,
    paged,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    setPage: (value: number) => requestedPage.set(Math.min(Math.max(value, 1), totalPages())),
  };
}

export type TableState<T, S extends string> = ReturnType<typeof tableState<T, S>>;

/** Comparateurs usuels. */
export const byText = <T>(get: (item: T) => string | null | undefined, dir: 1 | -1 = 1) =>
  (a: T, b: T) => dir * (get(a) || '').localeCompare(get(b) || '');

export const byDate = <T>(get: (item: T) => string | null | undefined, dir: 1 | -1 = -1) =>
  (a: T, b: T) => dir * (new Date(get(a) || 0).getTime() - new Date(get(b) || 0).getTime());
