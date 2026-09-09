"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { searchAll, type GroupedSearchResults } from "@/lib/queries/search";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type ResultGroupKey = "customers" | "products" | "orders";

type FlatResult = {
  key: string;
  group: ResultGroupKey;
  href: string;
  primary: string;
  secondary: string;
};

const GROUP_LABELS: Record<ResultGroupKey, string> = {
  customers: "Customers",
  products: "Products",
  orders: "Orders",
};

const GROUP_ORDER: ResultGroupKey[] = ["customers", "products", "orders"];

function flattenResults(results: GroupedSearchResults | null): FlatResult[] {
  if (!results) return [];

  const customerItems: FlatResult[] = results.customers.results.map((c) => ({
    key: `customer-${c.id}`,
    group: "customers",
    href: c.href,
    primary: c.name,
    secondary: c.email ?? "No email",
  }));

  const productItems: FlatResult[] = results.products.results.map((p) => ({
    key: `product-${p.id}`,
    group: "products",
    href: p.href,
    primary: p.designName,
    secondary: `${p.productName} · ${p.series} · ${p.size}`,
  }));

  const orderItems: FlatResult[] = results.orders.results.map((o) => ({
    key: `order-${o.id}`,
    group: "orders",
    href: o.href,
    primary: `Order #${o.id}`,
    secondary: `${o.customerName} · ${o.status}`,
  }));

  return [...customerItems, ...productItems, ...orderItems];
}

export function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const requestId = ++requestIdRef.current;

    searchAll(trimmed).then((data) => {
      if (requestIdRef.current !== requestId) return;
      setResults(data);
      setLoading(false);
      setHighlightedIndex(-1);
    });
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flatResults = useMemo(() => flattenResults(results), [results]);
  const hasAnyResults = flatResults.length > 0;

  function closeDropdown() {
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function selectResult(href: string) {
    closeDropdown();
    router.push(href);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      requestIdRef.current++;
      setResults(null);
      setLoading(false);
      closeDropdown();
    } else {
      setLoading(true);
      setOpen(true);
      setHighlightedIndex(-1);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      closeDropdown();
      inputRef.current?.blur();
      return;
    }

    if (!open || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? flatResults.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectResult(flatResults[highlightedIndex].href);
    }
  }

  let runningIndex = 0;

  return (
    <div ref={containerRef} className="relative w-56 lg:w-64">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (hasAnyResults || loading) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          aria-label="Search customers, products, and orders"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {open && (
        <div className="absolute right-0 z-30 mt-1 max-h-96 w-80 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : !hasAnyResults ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No results for &quot;{debouncedQuery.trim()}&quot;
            </p>
          ) : (
            GROUP_ORDER.map((groupKey) => {
              const group = results?.[groupKey];
              const items = flatResults.filter((r) => r.group === groupKey);
              if (!group || items.length === 0) return null;

              const startIndex = runningIndex;
              runningIndex += items.length;

              return (
                <div key={groupKey} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {GROUP_LABELS[groupKey]}
                  </p>
                  <ul>
                    {items.map((item, i) => {
                      const isHighlighted = startIndex + i === highlightedIndex;
                      return (
                        <li key={item.key}>
                          <Link
                            href={item.href}
                            onClick={closeDropdown}
                            onMouseEnter={() => setHighlightedIndex(startIndex + i)}
                            className={`block px-3 py-2 text-sm ${
                              isHighlighted
                                ? "bg-blue-50 dark:bg-gray-700"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <p className="font-medium text-gray-900 dark:text-white">{item.primary}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.secondary}</p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {group.hasMore && (
                    <p className="px-3 pb-2 text-xs text-gray-400 dark:text-gray-500">
                      More matches — refine your search to narrow results
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
