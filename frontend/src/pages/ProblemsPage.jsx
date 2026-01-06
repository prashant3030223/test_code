import { Link, useSearchParams } from "react-router";
import Navbar from "../components/Navbar";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { problemApi } from "../api/problems";
import { ChevronRightIcon, SearchIcon, Building2Icon, FilterIcon, SparklesIcon, TrendingUpIcon, Loader2Icon, CheckCircle2, ChevronLeftIcon, ChevronsRightIcon } from "lucide-react";

function ProblemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const PAGE_SIZE = 10;

  // State initialization from URL params
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");

  // Sync page to URL
  useEffect(() => {
    setSearchParams(params => {
      params.set("page", page.toString());
      return params;
    });
  }, [page, setSearchParams]);

  // Fetch Stats & Metadata (Difficulty Counts, Company List) - Cached
  const { data: globalStats = [] } = useQuery({
    queryKey: ["problemStats"],
    queryFn: problemApi.getGlobalStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate metadata from light stats
  const { allCompanies, easyCount, mediumCount, hardCount, totalCount } = useMemo(() => {
    const companies = new Set();
    let e = 0, m = 0, h = 0;
    globalStats.forEach(p => {
      p.companies?.forEach(c => companies.add(c));
      const d = p.difficulty;
      if (d === "Easy") e++;
      else if (d === "Medium") m++;
      else if (d === "Hard") h++;
    });
    return {
      allCompanies: Array.from(companies).sort(),
      easyCount: e,
      mediumCount: m,
      hardCount: h,
      totalCount: globalStats.length
    };
  }, [globalStats]);

  // Fetch Paginated Problems
  const { data: paginatedData, isLoading, isPreviousData } = useQuery({
    queryKey: ["problems", page, searchQuery, selectedDifficulty, selectedCompany],
    queryFn: () => problemApi.getProblemsPaginated({
      page,
      pageSize: PAGE_SIZE,
      search: searchQuery,
      difficulty: selectedDifficulty,
      company: selectedCompany
    }),
    keepPreviousData: true
  });

  const problems = paginatedData?.problems || [];
  const totalResults = paginatedData?.count || 0;
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  // Reset page when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  if (isLoading && !problems.length) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2Icon className="size-12 animate-spin text-primary" />
        <p className="text-white/40 font-black uppercase tracking-[0.3em]">Loading Quest Bank...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* HERO SECTION */}
        <div className="relative mb-16 p-12 rounded-[3.5rem] bg-gradient-to-br from-primary/20 via-base-100 to-secondary/20 border border-white/5 overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
            <SparklesIcon className="size-48 text-primary animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8">
              <TrendingUpIcon className="size-4" />
              Interview Prep 2024
            </div>
            <h1 className="text-7xl font-black mb-6 tracking-tighter leading-none">
              Master the <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Workflow</span>
            </h1>
            <p className="max-w-xl text-xl text-white/50 font-medium leading-relaxed">
              Practice the exact problems asked in top-tier technical interviews. Curated by engineers from FAANG+ companies.
            </p>
          </div>
        </div>

        {/* TOP COMPANIES EXPLORE */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white/90 flex items-center gap-3">
              <Building2Icon className="size-6 text-primary" />
              Explore Companies
            </h2>
            <button
              onClick={() => handleFilterChange(setSelectedCompany, "All")}
              className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allCompanies.slice(0, 6).map(company => (
              <button
                key={company}
                onClick={() => handleFilterChange(setSelectedCompany, company)}
                className={`group p-6 rounded-[2rem] border transition-all duration-500 text-center
                            ${selectedCompany === company
                    ? "bg-primary border-primary shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
                    : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]"}`}
              >
                <div className={`size-12 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-500
                            ${selectedCompany === company ? "bg-white/20" : "bg-white/5 group-hover:scale-110 group-hover:bg-white/10"}`}>
                  <span className="text-xl font-black">{company[0]}</span>
                </div>
                <span className={`text-xs font-black uppercase tracking-widest transition-colors
                            ${selectedCompany === company ? "text-white" : "text-white/40 group-hover:text-white"}`}>
                  {company}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-12 pt-8 border-t border-white/5">
          {/* FILTERS */}
          <div className="lg:col-span-1 space-y-8">
            <div className="sticky top-24 space-y-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
                  <FilterIcon className="size-4" />
                  Refine Search
                </h3>

                <div className="space-y-6">
                  <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-30 group-focus-within:opacity-100 transition-opacity" />
                    <input
                      type="text"
                      placeholder="Search problems..."
                      className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium"
                      value={searchQuery}
                      onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {["All", "Easy", "Medium", "Hard"].map(diff => (
                      <button
                        key={diff}
                        onClick={() => handleFilterChange(setSelectedDifficulty, diff)}
                        className={`h-12 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all
                                        ${selectedDifficulty === diff
                            ? "bg-white text-black border-white"
                            : "bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white"}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
                <h4 className="font-black text-sm uppercase tracking-widest text-primary mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-xs font-bold uppercase">Total Problems</span>
                    <span className="font-black">{totalCount}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center p-2 rounded-xl bg-white/5">
                      <div className="text-[10px] text-success font-black uppercase">{easyCount}</div>
                      <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Easy</div>
                    </div>
                    <div className="flex-1 text-center p-2 rounded-xl bg-white/5">
                      <div className="text-[10px] text-warning font-black uppercase">{mediumCount}</div>
                      <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Med</div>
                    </div>
                    <div className="flex-1 text-center p-2 rounded-xl bg-white/5">
                      <div className="text-[10px] text-error font-black uppercase">{hardCount}</div>
                      <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Hard</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEMS LIST */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-4 px-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/20">
                Showing {problems.length} of {totalResults} Problems
              </span>
              {selectedCompany !== "All" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Filtering by:</span>
                  <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase text-primary tracking-widest">
                    {selectedCompany}
                  </div>
                </div>
              )}
            </div>

            {problems.length > 0 ? (
              <>
                <div className="space-y-4">
                  {problems.map((problem, index) => (
                    <Link
                      key={problem.id}
                      to={`/problem/${problem.id}`}
                      className="group relative block p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 overflow-hidden"
                    >
                      <div className="relative z-10 flex items-center justify-between gap-8">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border-b-2
                            ${problem.difficulty === "Easy" ? "bg-green-500/10 text-green-500 border-green-500/50" :
                                problem.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50" :
                                  "bg-red-500/10 text-red-500 border-red-500/50"}`}>
                              {problem.difficulty}
                            </div>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">{problem.category}</span>
                          </div>

                          <h2 className="text-3xl font-black mb-6 group-hover:text-primary transition-colors tracking-tight flex items-center gap-3">
                            {problem.title}
                            {problem.isSolved && (
                              <CheckCircle2 className="size-6 text-green-500 fill-green-500/10" />
                            )}
                          </h2>

                          {/* COMPANY TAGS */}
                          <div className="flex flex-wrap gap-2">
                            {problem.companies?.map(company => (
                              <div key={company} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{company}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="size-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-500 group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)]">
                          <ChevronRightIcon className="size-6 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* PAGINATION */}
                <div className="flex items-center justify-center gap-4 py-8 mt-8 border-t border-white/5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <ChevronLeftIcon className="size-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(page - p) <= 1)
                      .map((p, i, arr) => (
                        <div key={p} className="flex items-center">
                          {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-white/20">...</span>}
                          <button
                            onClick={() => setPage(p)}
                            className={`size-10 rounded-xl font-bold flex items-center justify-center transition-all
                            ${page === p
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}
                          >
                            {p}
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <ChevronRightIcon className="size-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-32 rounded-[3.5rem] bg-white/[0.02] border border-dashed border-white/10 text-center">
                <SearchIcon className="size-20 mx-auto mb-6 text-white/10" />
                <h3 className="text-2xl font-black text-white/40">No problems found</h3>
                <p className="text-white/20 mt-2 font-medium">Try clearing your filters to see more results</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedDifficulty("All"); setSelectedCompany("All"); setPage(1); }}
                  className="mt-8 px-8 py-3 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemsPage;
