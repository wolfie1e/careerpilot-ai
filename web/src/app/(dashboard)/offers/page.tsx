"use client";

import { useState } from "react";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  OFFER_STATUSES,
  activeOfferCount,
  bestOffer,
  createOfferComparison,
  offerDecisionScore,
  offerTotalCompensation,
  sortOffers,
  type OfferComparison,
  type OfferStatus,
} from "@/lib/offer-tracker";

export default function OffersPage() {
  const [offers, setOffers] = useLocalStorage<OfferComparison[]>(LOCAL_STORAGE_KEYS.offerComparisons, []);
  const [company, setCompany] = useState("");
  const visibleOffers = sortOffers(offers).filter((offer) => offer.status !== "archived");
  const topOffer = bestOffer(offers);

  function addOffer() {
    if (!company.trim()) return;
    setOffers((current) => [createOfferComparison(company), ...current]);
    setCompany("");
    toast.success("Offer added");
  }

  function updateOffer(id: string, patch: Partial<OfferComparison>) {
    setOffers((current) => current.map((offer) => offer.id === id ? { ...offer, ...patch, updatedAt: new Date().toISOString() } : offer));
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Offer Tracker</h2>
        <p className="mt-1 text-sm text-gray-400">Compare compensation, decision deadlines, and role quality.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Active offers", activeOfferCount(offers)],
          ["Best score", topOffer ? offerDecisionScore(topOffer) : 0],
          ["Top comp", topOffer ? `${topOffer.currency} ${offerTotalCompensation(topOffer).toLocaleString()}` : "—"],
          ["Negotiating", offers.filter((offer) => offer.status === "negotiating").length],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={company} maxLength={120} onChange={(event) => setCompany(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addOffer(); }} placeholder="Add a company offer" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addOffer} disabled={!company.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add offer</button>
        </div>
      </div>

      {visibleOffers.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><BriefcaseBusiness className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">Add your first offer to compare compensation and tradeoffs.</p></div>
      ) : (
        <div className="space-y-3">
          {visibleOffers.map((offer) => (
            <article key={offer.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="grid gap-2 md:grid-cols-3">
                <input value={offer.company} maxLength={120} onChange={(event) => updateOffer(offer.id, { company: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                <input value={offer.role} maxLength={120} onChange={(event) => updateOffer(offer.id, { role: event.target.value })} placeholder="Role" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <select value={offer.status} onChange={(event) => updateOffer(offer.id, { status: event.target.value as OfferStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{OFFER_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
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
              <div className="mt-3 text-xs text-gray-500">Decision score {offerDecisionScore(offer)} · Total comp {offer.currency} {offerTotalCompensation(offer).toLocaleString()}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
