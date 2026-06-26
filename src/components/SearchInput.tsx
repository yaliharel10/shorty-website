"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Clock, Film, Search, TrendingUp, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRENDING_SEARCHES, useSearchHistory } from "@/hooks/useSearchHistory";
import { useDebouncedValue } from "@/hooks/useUI";

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-[#ff7a18]/30 px-0.5 text-white">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

type ApiSuggestion = {
  films: { id: string; title: string; category: string; posterUrl: string }[];
  people: { id: string; slug: string; name: string; primaryRole: string; imgUrl: string }[];
  trending?: string[];
};

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onPickFilm?: (id: string) => void;
  onPickPerson?: (slug: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export function SearchInput({
  value,
  onChange,
  onSubmit,
  onPickFilm,
  onPickPerson,
  placeholder = "Search films & people...",
  className,
  inputClassName,
}: SearchInputProps) {
  const listId = useId();
  const { recent, addSearch, clearHistory } = useSearchHistory();
  const debounced = useDebouncedValue(value, 250);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiData, setApiData] = useState<ApiSuggestion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = debounced.trim();
    const url = q.length >= 2 ? `/api/search/suggestions?q=${encodeURIComponent(q)}` : "/api/search/suggestions";
    fetch(url)
      .then((r) => r.json())
      .then(setApiData)
      .catch(() => setApiData(null));
  }, [debounced]);

  const textSuggestions = [
    ...recent
      .filter((q) => !value || q.toLowerCase().includes(value.toLowerCase()))
      .map((q) => ({ type: "recent" as const, label: q })),
    ...(apiData?.trending ?? TRENDING_SEARCHES)
      .filter(
        (q) =>
          !recent.includes(q) &&
          (!value || q.toLowerCase().includes(value.toLowerCase()))
      )
      .map((q) => ({ type: "trending" as const, label: q })),
  ].slice(0, 4);

  const filmSuggestions = (apiData?.films ?? []).slice(0, 4);
  const peopleSuggestions = (apiData?.people ?? []).slice(0, 3);
  const totalItems =
    textSuggestions.length + filmSuggestions.length + peopleSuggestions.length;

  const pick = (query: string) => {
    onChange(query);
    addSearch(query);
    onSubmit?.(query);
    setOpen(false);
    setActiveIndex(-1);
  };

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]"
        aria-hidden
      />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            addSearch(value);
            onSubmit?.(value);
            setOpen(false);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-full border border-[#333] bg-[#1a1a1a]/90 py-2 pl-9 pr-9 text-sm text-white outline-none transition",
          "placeholder:text-[#666] focus:border-[#ff7a18] focus:ring-2 focus:ring-[#ff7a18]/25",
          inputClassName
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#888] transition hover:bg-white/10 hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && totalItems > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 overflow-y-auto rounded-xl border border-[#333] bg-[#111]/95 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          {filmSuggestions.length > 0 && (
            <>
              <li className="border-b border-[#222] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#666]">
                Films
              </li>
              {filmSuggestions.map((film) => (
                <li key={film.id} role="option">
                  <button
                    type="button"
                    onClick={() => {
                      onPickFilm?.(film.id);
                      pick(film.title);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-white/5"
                  >
                    <Image
                      src={film.posterUrl}
                      alt=""
                      width={32}
                      height={48}
                      className="rounded object-cover"
                    />
                    <span className="truncate">{highlightMatch(film.title, value)}</span>
                    <Film className="ml-auto h-3.5 w-3.5 shrink-0 text-[#666]" />
                  </button>
                </li>
              ))}
            </>
          )}

          {peopleSuggestions.length > 0 && (
            <>
              <li className="border-b border-[#222] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#666]">
                People
              </li>
              {peopleSuggestions.map((person) => (
                <li key={person.id} role="option">
                  <button
                    type="button"
                    onClick={() => {
                      onPickPerson?.(person.slug);
                      pick(person.name);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-white/5"
                  >
                    <Image
                      src={person.imgUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <span className="truncate">{highlightMatch(person.name, value)}</span>
                    <User className="ml-auto h-3.5 w-3.5 shrink-0 text-[#666]" />
                  </button>
                </li>
              ))}
            </>
          )}

          {textSuggestions.length > 0 && (
            <>
              {recent.length > 0 && (
                <li className="flex items-center justify-between border-b border-[#222] px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Recent & trending
                  </span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-[10px] text-[#888] hover:text-[#ff7a18]"
                  >
                    Clear
                  </button>
                </li>
              )}
              {textSuggestions.map((item, index) => (
                <li key={`${item.type}-${item.label}`} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    onClick={() => pick(item.label)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition",
                      index === activeIndex ? "bg-[#ff7a18]/15 text-white" : "text-[#ccc] hover:bg-white/5"
                    )}
                  >
                    {item.type === "recent" ? (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#666]" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#ff7a18]" />
                    )}
                    <span className="truncate">{highlightMatch(item.label, value)}</span>
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
