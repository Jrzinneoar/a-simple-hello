import { useQueries } from "@tanstack/react-query";
import { titleQuery, type Title } from "./catalog";

/** Resolves a list of IMDb ids (watchlist, history) into titles. */
export function useTitles(ids: string[]): Title[] {
  const res = useQueries({ queries: ids.filter((id) => /^tt\d+$/.test(id)).map((id) => titleQuery(id)) });
  return res.map((r) => r.data).filter((t): t is Title => !!t);
}
