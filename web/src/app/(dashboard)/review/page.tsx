"use client";

import type { ChangeEvent } from "react";
import { CheckCircle2, Download, NotebookPen, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { JobApplication } from "@/lib/application-tracker";
import type { PlannerTask } from "@/lib/career-planner";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import {
  averageReviewConfidence,
  createWeeklyReview,
  mergeWeeklyReviews,
  sortWeeklyReviews,
  weekStart,
  weeklyReviewCompletion,
  weeklyReviewSummary,
  type WeeklyReview,
} from "@/lib/weekly-review";
import { isNetworkingFollowUpDue, type NetworkingContact } from "@/lib/networking";
import type { CareerGoal } from "@/lib/career-goals";
import type { OfferComparison } from "@/lib/offer-tracker";
import type { AchievementStory } from "@/lib/achievement-vault";
import { isCertificationActive, isCertificationExpiring, type CertificationRecord } from "@/lib/certification-tracker";

export default function WeeklyReviewPage() {
  const [reviews, setReviews] = useLocalStorage<WeeklyReview[]>(LOCAL_STORAGE_KEYS.weeklyReviews, []);
  const [plannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [applications] = useLocalStorage<JobApplication[]>(LOCAL_STORAGE_KEYS.jobApplications, []);
  const [networkingContacts] = useLocalStorage<NetworkingContact[]>(LOCAL_STORAGE_KEYS.networkingContacts, []);
  const [careerGoals] = useLocalStorage<CareerGoal[]>(LOCAL_STORAGE_KEYS.careerGoals, []);
  const [offerComparisons] = useLocalStorage<OfferComparison[]>(LOCAL_STORAGE_KEYS.offerComparisons, []);
  const [achievementStories] = useLocalStorage<AchievementStory[]>(LOCAL_STORAGE_KEYS.achievementStories, []);
  const [certificationRecords] = useLocalStorage<CertificationRecord[]>(LOCAL_STORAGE_KEYS.certificationRecords, []);
  const currentWeek = weekStart();
  const currentReview = reviews.find((review) => review.weekOf === currentWeek) || createWeeklyReview();
  const orderedReviews = sortWeeklyReviews(reviews);
  const completedActions = plannerTasks.filter((task) => task.completedAt && new Date(task.completedAt) >= new Date(`${currentWeek}T00:00:00`)).length;
  const appliedThisWeek = applications.filter((application) => application.appliedAt >= currentWeek).length;
  const upcomingInterviews = applications.filter((application) => application.interviewAt && new Date(application.interviewAt) >= new Date()).length;
  const networkingFollowUpsDue = networkingContacts.filter((contact) => isNetworkingFollowUpDue(contact)).length;
  const activeGoalCount = careerGoals.filter((goal) => goal.status === "active").length;
  const activeOfferCount = offerComparisons.filter((offer) => !["accepted", "declined", "archived"].includes(offer.status)).length;
  const readyAchievementCount = achievementStories.filter((story) => story.status === "ready").length;
  const activeCertificationCount = certificationRecords.filter((record) => isCertificationActive(record)).length;
  const certificationRenewalsDue = certificationRecords.filter((record) => isCertificationExpiring(record)).length;
  const completion = weeklyReviewCompletion(currentReview);
  const reviewCopyText = `${weeklyReviewSummary(currentReview)}\nNetworking contacts: ${networkingContacts.length}\nNetworking follow-ups due: ${networkingFollowUpsDue}\nActive career goals: ${activeGoalCount}\nActive offers: ${activeOfferCount}\nReady achievement stories: ${readyAchievementCount}\nActive certifications: ${activeCertificationCount}\nCertification renewals: ${certificationRenewalsDue}`;

  function saveReview(patch: Partial<WeeklyReview>) {
    const next = { ...currentReview, ...patch, updatedAt: new Date().toISOString() };
    setReviews((current) => [next, ...current.filter((review) => review.weekOf !== currentWeek)]);
  }

  function addFocusToPlanner() {
    if (!currentReview.nextFocus.trim()) return;
    const task: PlannerTask = {
      id: crypto.randomUUID(), title: currentReview.nextFocus.trim(), notes: `Created from weekly review for ${currentWeek}`,
      priority: "high", category: "other", estimateMinutes: 30, resourceUrl: "", status: "todo", dueDate: "",
      createdAt: new Date().toISOString(), completedAt: null, archived: false, tags: ["weekly-focus"], recurrence: "none",
    };
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.plannerTasks, JSON.stringify([task, ...plannerTasks]));
    toast.success("Next focus added to planner");
  }

  async function importReviews(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { reviews?: WeeklyReview[] } | WeeklyReview[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.reviews || [];
      setReviews((current) => mergeWeeklyReviews(current, incoming));
      toast.success(`${incoming.length} reviews imported`);
    } catch {
      toast.error("Could not import weekly reviews");
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Weekly Review</h2>
        <p className="mt-1 text-sm text-gray-400">Review the week of {currentWeek} and choose what matters next.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-11">
        {[
          ["Review complete", `${completion}%`],
          ["Actions completed", completedActions],
          ["Applications sent", appliedThisWeek],
          ["Upcoming interviews", upcomingInterviews],
          ["Networking due", networkingFollowUpsDue],
          ["Active goals", activeGoalCount],
          ["Active offers", activeOfferCount],
          ["Ready stories", readyAchievementCount],
          ["Active certs", activeCertificationCount],
          ["Renewals", certificationRenewalsDue],
          ["Avg confidence", `${averageReviewConfidence(reviews)}/10`],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="font-semibold text-white">Current reflection</h3>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={reviewCopyText} label="Copy review" />
            <button onClick={() => downloadJson("careerpilot-weekly-reviews.json", { reviews, networking: { contacts: networkingContacts.length, follow_ups_due: networkingFollowUpsDue }, goals: { active: activeGoalCount, total: careerGoals.length }, offers: { active: activeOfferCount, total: offerComparisons.length }, achievements: { ready: readyAchievementCount, total: achievementStories.length }, certifications: { active: activeCertificationCount, renewals_due: certificationRenewalsDue, total: certificationRecords.length } })} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300"><Download className="h-3.5 w-3.5" />JSON</button>
            <button onClick={() => downloadCsv("careerpilot-weekly-reviews.csv", orderedReviews.map((review) => ({ week_of: review.weekOf, confidence: review.confidence, wins: review.wins, challenges: review.challenges, lessons: review.lessons, next_focus: review.nextFocus, networking_contacts: networkingContacts.length, networking_follow_ups_due: networkingFollowUpsDue, active_career_goals: activeGoalCount, active_offers: activeOfferCount, ready_achievement_stories: readyAchievementCount, active_certifications: activeCertificationCount, certification_renewals_due: certificationRenewalsDue })))} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300"><Download className="h-3.5 w-3.5" />CSV</button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300"><Upload className="h-3.5 w-3.5" />Import<input type="file" accept=".json,application/json" onChange={importReviews} className="sr-only" /></label>
          </div>
        </div>
        {[
          ["wins", "What went well?", "Capture progress, momentum, and small wins."],
          ["challenges", "What was difficult?", "Name blockers, friction, and missed opportunities."],
          ["lessons", "What did you learn?", "Record insights worth carrying forward."],
          ["nextFocus", "What is next week's focus?", "Choose one clear, high-leverage priority."],
        ].map(([key, label, placeholder]) => (
          <label key={key} className="block"><span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span><textarea value={currentReview[key as keyof WeeklyReview] as string} onChange={(event) => saveReview({ [key]: event.target.value })} maxLength={2000} rows={3} placeholder={placeholder} className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" /></label>
        ))}
        <label className="block"><span className="mb-2 block text-sm font-medium text-gray-300">Career confidence: {currentReview.confidence}/10</span><input type="range" min={1} max={10} value={currentReview.confidence} onChange={(event) => saveReview({ confidence: Number(event.target.value) })} className="w-full accent-blue-500" /></label>
        <button onClick={addFocusToPlanner} disabled={!currentReview.nextFocus.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add next focus to planner</button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Review history</h3>
        {orderedReviews.length === 0 ? <div role="status" className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500"><NotebookPen className="mx-auto mb-3 h-8 w-8" />Your first reflection will appear here as you write.</div> : orderedReviews.map((review) => (
          <article key={review.id} className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
            <div className="min-w-0 flex-1"><div className="font-semibold text-white">Week of {review.weekOf}</div><div className="mt-1 text-xs text-gray-500">{weeklyReviewCompletion(review)}% complete · confidence {review.confidence}/10</div><p className="mt-2 text-sm text-gray-300">{review.nextFocus || "No next focus captured"}</p></div>
            <button onClick={() => setReviews((current) => current.filter((item) => item.id !== review.id))} aria-label={`Delete review for ${review.weekOf}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
          </article>
        ))}
      </div>
    </div>
  );
}
