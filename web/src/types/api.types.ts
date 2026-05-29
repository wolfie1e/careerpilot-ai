export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "enterprise";
  is_active: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Resume {
  id: string;
  filename: string;
  file_type: string;
  file_size: number | null;
  word_count: number | null;
  parsed_sections: Record<string, unknown> | null;
  created_at: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  overall_score: number;
  section_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{
    section: string;
    type: string;
    message: string;
    priority: "high" | "medium" | "low";
  }>;
  ats_score: number;
  ats_breakdown: Record<string, number>;
  created_at: string;
}

export interface MatchResult {
  id: string;
  overall_score: number;
  semantic_score: number;
  keyword_score: number;
  skills_matched: string[];
  skills_missing: string[];
  skills_critical: string[];
  learning_roadmap: Array<{
    skill: string;
    resources: string[];
    priority: string;
    weeks: number;
  }>;
}

export interface InterviewSession {
  id: string;
  role_title: string;
  difficulty: string;
  interview_type: string;
  session_mode: "text" | "voice";
  question_count: number;
  status: "active" | "completed" | "abandoned";
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface InterviewQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  topic_area: string | null;
  expected_focus: string | null;
}

export interface AnswerFeedback {
  score: number;
  rubric_scores: Record<string, number>;
  feedback_positive: string[];
  feedback_improve: string[];
  model_answer_hint: string;
}

export interface AnalyticsOverview {
  score_trends: Array<{ date: string; ats_score: number; match_score: number; interview_score: number }>;
  interview_stats: {
    total: number;
    avg_score: number;
    best_score: number;
    by_type: Record<string, number>;
  };
  skill_coverage: { matched: number; missing: number; critical: number };
  ats_trend: Array<{ date: string; score: number }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
