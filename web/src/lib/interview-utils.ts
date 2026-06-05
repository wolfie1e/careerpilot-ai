export interface InterviewSessionRouteInfo {
  id: string;
  session_mode: string;
  status: string;
}

export function interviewSessionHref(session: InterviewSessionRouteInfo) {
  if (session.status === "active") return `/interview/${session.session_mode}/${session.id}`;
  return `/interview/history/${session.id}`;
}
