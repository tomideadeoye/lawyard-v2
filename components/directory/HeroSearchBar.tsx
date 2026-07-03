"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Specialty } from "@/lib/api";

export function HeroSearchBar({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("");
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (specialty) params.set("specialty", specialty);
    router.push(`/directory/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row items-stretch overflow-hidden border border-white/20">
      {/* Search Input */}
      <div className="flex-1 relative flex items-center group min-w-0">
        <svg
          className="absolute left-5 text-slate-400 w-4 h-4 group-focus-within:text-slate-700 transition-colors pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 11L14.5 14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border-none outline-none py-5 pl-12 pr-5 text-slate-900 bg-transparent text-sm placeholder:text-slate-400 font-medium"
        />
      </div>

      <div className="hidden md:block w-px bg-slate-200 my-3" />

      {/* Specialty Dropdown */}
      <div className="flex-1 relative flex items-center group min-w-0">
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="w-full border-none outline-none py-5 pl-5 pr-10 text-slate-700 bg-transparent text-sm cursor-pointer appearance-none font-medium"
        >
          <option value="">Areas of expertise</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.slug || s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-4 pointer-events-none text-slate-400 w-3.5 h-3.5"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="hidden md:block w-px bg-slate-200 my-3" />

      {/* Location Dropdown */}
      <div className="flex-1 relative flex items-center group min-w-0">
        <select
          defaultValue=""
          className="w-full border-none outline-none py-5 pl-5 pr-10 text-slate-700 bg-transparent text-sm cursor-pointer appearance-none font-medium"
        >
          <option value="" disabled>
            Location
          </option>
          <option value="lagos">Lagos</option>
          <option value="abuja">Abuja</option>
          <option value="port-harcourt">Port Harcourt</option>
          <option value="ibadan">Ibadan</option>
          <option value="kano">Kano</option>
        </select>
        <svg
          className="absolute right-4 pointer-events-none text-slate-400 w-3.5 h-3.5"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="py-5 px-7 bg-accent hover:bg-accent/90 text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M11 11L14.5 14.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Search
      </button>
    </div>
  );
}
