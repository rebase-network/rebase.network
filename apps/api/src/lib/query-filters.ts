import { and, type SQL } from 'drizzle-orm';

export const combineFilters = (filters: Array<SQL<unknown> | undefined>) => {
  const activeFilters = filters.filter(Boolean) as SQL<unknown>[];

  if (activeFilters.length === 0) {
    return undefined;
  }

  if (activeFilters.length === 1) {
    return activeFilters[0];
  }

  return and(...activeFilters);
};

export const toContainsPattern = (value: string) => `%${value.trim()}%`;
