export const APP_NAME = "CareerPilot AI";
export const APP_DESCRIPTION = "Your AI Career Coach for Resumes, Interviews, and Job Readiness";

export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const COOKIE_NAME = "careerpilot_token";

export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];

export const INTERVIEW_TYPES = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR / General" },
  { value: "mixed", label: "Mixed" },
  { value: "system_design", label: "System Design" },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
] as const;

export const QUESTION_COUNTS = [3, 5, 7, 10] as const;

export const ROLE_PRESETS = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Product Manager",
  "Data Analyst",
  "Machine Learning Engineer",
] as const;

export const INTERVIEW_PREP_TIPS = {
  behavioral: "Focus on STAR stories with measurable outcomes.",
  technical: "Expect tradeoffs, debugging steps, and fundamentals.",
  hr: "Prepare concise motivation, teamwork, and conflict examples.",
  mixed: "Balance role knowledge with communication and ownership.",
  system_design: "Lead with requirements, constraints, and architecture tradeoffs.",
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/resume", label: "Resume", icon: "FileText" },
  { href: "/interview", label: "Interview", icon: "MessageSquare" },
  { href: "/analytics", label: "Analytics", icon: "BarChart2" },
  { href: "/reports", label: "Reports", icon: "Download" },
] as const;
