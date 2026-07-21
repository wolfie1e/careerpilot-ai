"use client";

import { useState, type ChangeEvent } from "react";
import { Archive, BriefcaseBusiness, Download, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  OFFER_STATUSES,
  acceptedOfferCount,
  activeOfferCount,
  averageOfferCommuteMinutes,
  averageOfferDecisionScore,
  averageOfferQualityScore,
  averageOfferTotalCompensation,
  bestOffer,
  createOfferComparison,
  highestOfferCompensation,
  isOfferDeadlineSoon,
  isOfferDeadlineOverdue,
  mergeOfferComparisons,
  negotiatingOfferCount,
  offerCurrencyCounts,
  offerDeadlineOverdueCount,
  offerDeadlineSoonCount,
  offerDecisionScore,
  offerQualityScore,
  offerPipelineText,
  offerStatusCounts,
  offerTagCounts,
  offerTotalCompensation,
  offerWorkModeCounts,
  offersMissingCompensationCount,
  offersMissingDeadlineCount,
  remoteOfferCount,
  sortOffers,
  totalAcceptedOfferCompensation,
  type OfferComparison,
  type OfferStatus,
} from "@/lib/offer-tracker";
import { downloadCsv, downloadJson } from "@/lib/export-utils";

export default function OffersPage() {
  const [offers, setOffers] = useLocalStorage<OfferComparison[]>(LOCAL_STORAGE_KEYS.offerComparisons, []);
  const [company, setCompany] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");
  const [workModeFilter, setWorkModeFilter] = useState<OfferComparison["workMode"] | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const visibleOffers = sortOffers(offers).filter((offer) => {
    if (!showArchived && offer.status === "archived") return false;
    if (statusFilter !== "all" && offer.status !== statusFilter) return false;
    if (workModeFilter !== "all" && offer.workMode !== workModeFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${offer.company} ${offer.role} ${offer.location} ${offer.notes} ${offer.tags.join(" ")}`.toLowerCase().includes(query);
  });
  const topOffer = bestOffer(offers);
  const statusRows = Object.entries(offerStatusCounts(visibleOffers)).map(([status, count]) => ({ status, count }));
  const currencyRows = Object.entries(offerCurrencyCounts(visibleOffers)).map(([currency, count]) => ({ currency, count }));
  const workModeRows = Object.entries(offerWorkModeCounts(visibleOffers)).map(([workMode, count]) => ({ work_mode: workMode, count }));
  const tagRows = Object.entries(offerTagCounts(visibleOffers)).map(([tag, count]) => ({ tag, count }));
  const topCompensation = highestOfferCompensation(offers);

  function addOffer() {
    if (!company.trim()) return;
    setOffers((current) => [createOfferComparison(company), ...current]);
    setCompany("");
    toast.success("Offer added");
  }

  function updateOffer(id: string, patch: Partial<OfferComparison>) {
    setOffers((current) => current.map((offer) => offer.id === id ? { ...offer, ...patch, updatedAt: new Date().toISOString() } : offer));
  }

  function removeOffer(id: string) {
    setOffers((current) => current.filter((offer) => offer.id !== id));
    toast.success("Offer deleted");
  }

  function duplicateOffer(offer: OfferComparison) {
    setOffers((current) => [{ ...offer, id: crypto.randomUUID(), company: `${offer.company} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current]);
    toast.success("Offer duplicated");
  }

  async function importOffers(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { offers?: OfferComparison[] } | OfferComparison[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.offers || [];
      setOffers((current) => mergeOfferComparisons(current, incoming));
      toast.success(`${incoming.length} offers imported`);
    } catch {
      toast.error("Could not import offers");
    }
  }

  function acceptVisibleOffers() {
    const visibleIds = new Set(visibleOffers.map((offer) => offer.id));
    setOffers((current) => current.map((offer) => visibleIds.has(offer.id) ? { ...offer, status: "accepted", updatedAt: new Date().toISOString() } : offer));
    toast.success("Visible offers accepted");
  }

  function declineVisibleOffers() {
    const visibleIds = new Set(visibleOffers.map((offer) => offer.id));
    setOffers((current) => current.map((offer) => visibleIds.has(offer.id) ? { ...offer, status: "declined", updatedAt: new Date().toISOString() } : offer));
    toast.success("Visible offers declined");
  }

  function archiveVisibleOffers() {
    const visibleIds = new Set(visibleOffers.map((offer) => offer.id));
    setOffers((current) => current.map((offer) => visibleIds.has(offer.id) ? { ...offer, status: "archived", updatedAt: new Date().toISOString() } : offer));
    toast.success("Visible offers archived");
  }

  function clearArchivedOffers() {
    setOffers((current) => current.filter((offer) => offer.status !== "archived"));
    toast.success("Archived offers cleared");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Offer Tracker</h2>
        <p className="mt-1 text-sm text-gray-400">Compare compensation, decision deadlines, and role quality.</p>
      </div>

      {topOffer && (
        <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-4 text-sm text-emerald-100">
          Strongest offer: <span className="font-semibold">{topOffer.company}</span> with decision score {offerDecisionScore(topOffer)} and quality {offerQualityScore(topOffer)}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-8">
        {[
          ["Active offers", activeOfferCount(offers)],
          ["Accepted", acceptedOfferCount(offers)],
          ["Best score", topOffer ? offerDecisionScore(topOffer) : 0],
          ["Avg decision", averageOfferDecisionScore(offers)],
          ["Avg quality", averageOfferQualityScore(offers)],
          ["Top comp", topOffer ? `${topOffer.currency} ${offerTotalCompensation(topOffer).toLocaleString()}` : "—"],
          ["Highest comp", topCompensation ? topCompensation.toLocaleString() : "—"],
          ["Avg comp", averageOfferTotalCompensation(offers).toLocaleString()],
          ["Accepted comp", totalAcceptedOfferCompensation(offers).toLocaleString()],
          ["Negotiating", negotiatingOfferCount(offers)],
          ["Deadline soon", offerDeadlineSoonCount(offers)],
          ["Overdue", offerDeadlineOverdueCount(offers)],
          ["Remote", remoteOfferCount(offers)],
          ["Avg commute", `${averageOfferCommuteMinutes(offers)}m`],
          ["Missing deadline", offersMissingDeadlineCount(offers)],
          ["Missing comp", offersMissingCompensationCount(offers)],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={company} maxLength={120} onChange={(event) => setCompany(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addOffer(); }} placeholder="Add a company offer" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addOffer} disabled={!company.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add offer</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={acceptVisibleOffers} disabled={!visibleOffers.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Accept visible</button>
        <button onClick={declineVisibleOffers} disabled={!visibleOffers.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Decline visible</button>
        <button onClick={archiveVisibleOffers} disabled={!visibleOffers.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive visible</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Archived</button>
        <button onClick={clearArchivedOffers} disabled={!offers.some((offer) => offer.status === "archived")} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear archived</button>
        <select aria-label="Filter offers by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OfferStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All statuses</option>{OFFER_STATUSES.filter((status) => status.value !== "archived").map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
        <select aria-label="Filter offers by work mode" value={workModeFilter} onChange={(event) => setWorkModeFilter(event.target.value as OfferComparison["workMode"] | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All modes</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option><option value="">Unset mode</option></select>
        <label className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offers" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" /></label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Upload className="h-4 w-4" />Import<input type="file" accept=".json,application/json" onChange={importOffers} className="sr-only" /></label>
        <CopyButton value={offerPipelineText(visibleOffers) || "No offers yet"} label="Copy offers" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-offers.json", { offers })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />JSON</button>
        <button onClick={() => downloadCsv("careerpilot-offers.csv", visibleOffers.map((offer) => ({ company: offer.company, role: offer.role, status: offer.status, currency: offer.currency, base_salary: offer.baseSalary, bonus: offer.bonus, equity: offer.equity, signing_bonus: offer.signingBonus, benefits_value: offer.benefitsValue, total_compensation: offerTotalCompensation(offer), quality_score: offerQualityScore(offer), decision_score: offerDecisionScore(offer), deadline: offer.decisionDeadline, start_date: offer.startDate, work_mode: offer.workMode, commute_minutes: offer.commuteMinutes, location: offer.location, tags: offer.tags.join(", ") })))} disabled={!visibleOffers.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />CSV</button>
        <button onClick={() => downloadCsv("careerpilot-offer-statuses.csv", statusRows)} disabled={!statusRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Statuses</button>
        <button onClick={() => downloadCsv("careerpilot-offer-currencies.csv", currencyRows)} disabled={!currencyRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Currencies</button>
        <button onClick={() => downloadCsv("careerpilot-offer-work-modes.csv", workModeRows)} disabled={!workModeRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Work modes</button>
        <button onClick={() => downloadCsv("careerpilot-offer-tags.csv", tagRows)} disabled={!tagRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Tags</button>
      </div>

      {visibleOffers.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><BriefcaseBusiness className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">Add your first offer to compare compensation and tradeoffs.</p></div>
      ) : (
        <div className="space-y-3">
          {visibleOffers.map((offer) => (
            <article key={offer.id} className={`rounded-2xl border bg-gray-900 p-5 ${isOfferDeadlineOverdue(offer) ? "border-rose-500/50" : isOfferDeadlineSoon(offer) ? "border-amber-500/50" : "border-gray-800"}`}>
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
                  <input value={offer.company} maxLength={120} onChange={(event) => updateOffer(offer.id, { company: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                  <input value={offer.role} maxLength={120} onChange={(event) => updateOffer(offer.id, { role: event.target.value })} placeholder="Role" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  <select value={offer.status} onChange={(event) => updateOffer(offer.id, { status: event.target.value as OfferStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{OFFER_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => duplicateOffer(offer)} aria-label={`Duplicate ${offer.company}`} className="text-gray-600 hover:text-emerald-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateOffer(offer.id, { status: "archived" })} aria-label={`Archive ${offer.company}`} className="text-gray-600 hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeOffer(offer.id)} aria-label={`Delete ${offer.company}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="number" value={offer.baseSalary} onChange={(event) => updateOffer(offer.id, { baseSalary: Number(event.target.value) })} placeholder="Base salary" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" value={offer.bonus} onChange={(event) => updateOffer(offer.id, { bonus: Number(event.target.value) })} placeholder="Bonus" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" value={offer.equity} onChange={(event) => updateOffer(offer.id, { equity: Number(event.target.value) })} placeholder="Equity value" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" value={offer.signingBonus} onChange={(event) => updateOffer(offer.id, { signingBonus: Number(event.target.value) })} placeholder="Signing bonus" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="number" value={offer.benefitsValue} onChange={(event) => updateOffer(offer.id, { benefitsValue: Number(event.target.value) })} placeholder="Benefits value" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={offer.currency} maxLength={8} onChange={(event) => updateOffer(offer.id, { currency: event.target.value.toUpperCase() })} placeholder="Currency" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={offer.location} maxLength={120} onChange={(event) => updateOffer(offer.id, { location: event.target.value })} placeholder="Location" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <select value={offer.workMode} onChange={(event) => updateOffer(offer.id, { workMode: event.target.value as OfferComparison["workMode"] })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300"><option value="">Work mode</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="date" value={offer.startDate} onChange={(event) => updateOffer(offer.id, { startDate: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={offer.decisionDeadline} onChange={(event) => updateOffer(offer.id, { decisionDeadline: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" value={offer.commuteMinutes} onChange={(event) => updateOffer(offer.id, { commuteMinutes: Number(event.target.value) })} placeholder="Commute minutes" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={(offer.tags || []).join(", ")} onChange={(event) => updateOffer(offer.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                {(["growthScore", "cultureScore", "learningScore", "stabilityScore"] as const).map((field) => (
                  <label key={field} className="text-xs text-gray-500">{field.replace("Score", "")}: {offer[field]}/10<input type="range" min={1} max={10} value={offer[field]} onChange={(event) => updateOffer(offer.id, { [field]: Number(event.target.value) })} className="mt-2 w-full accent-blue-500" /></label>
                ))}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <textarea value={offer.notes} maxLength={1600} onChange={(event) => updateOffer(offer.id, { notes: event.target.value })} rows={2} placeholder="Decision notes" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                <textarea value={offer.negotiationNotes} maxLength={1600} onChange={(event) => updateOffer(offer.id, { negotiationNotes: event.target.value })} rows={2} placeholder="Negotiation notes" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
              </div>
              <div className="mt-3 text-xs text-gray-500">Decision score {offerDecisionScore(offer)} · Total comp {offer.currency} {offerTotalCompensation(offer).toLocaleString()}{isOfferDeadlineOverdue(offer) ? " · deadline overdue" : isOfferDeadlineSoon(offer) ? " · deadline soon" : ""}</div>
            </article>
          ))}
        </div>
      )}

      {(statusRows.some((row) => row.count > 0) || currencyRows.length > 0 || workModeRows.length > 0 || tagRows.length > 0) && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Statuses</h3>
            <div className="mt-3 space-y-2">{statusRows.filter((row) => row.count > 0).map((row) => <div key={row.status} className="flex justify-between text-sm text-gray-400"><span>{OFFER_STATUSES.find((status) => status.value === row.status)?.label}</span><span className="text-white">{row.count}</span></div>)}</div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Currencies</h3>
            <div className="mt-3 flex flex-wrap gap-2">{currencyRows.slice(0, 8).map((row) => <span key={row.currency} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{row.currency} · {row.count}</span>)}</div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Work modes</h3>
            <div className="mt-3 flex flex-wrap gap-2">{workModeRows.slice(0, 8).map((row) => <span key={row.work_mode} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{row.work_mode || "unset"} · {row.count}</span>)}</div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">{tagRows.slice(0, 10).map((row) => <span key={row.tag} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{row.tag} · {row.count}</span>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
