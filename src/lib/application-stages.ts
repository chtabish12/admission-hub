export type Stage = {
  key: string;
  label: string;
  description: string;
  color: string;
  terminal?: boolean;
};

export const STAGES: Stage[] = [
  { key: "new", label: "New Applications", description: "Freshly submitted applications awaiting triage", color: "bg-slate-500" },
  { key: "doc_verification", label: "Document Verification", description: "Verifying authenticity of submitted documents", color: "bg-amber-500" },
  { key: "academic_review", label: "Academic Review", description: "Evaluating academic transcripts and grades", color: "bg-cyan-500" },
  { key: "eligibility", label: "Eligibility Check", description: "Confirming program-specific eligibility criteria", color: "bg-violet-500" },
  { key: "scholarship", label: "Scholarship Review", description: "Assessing scholarship eligibility and merit", color: "bg-pink-500" },
  { key: "interview_required", label: "Interview Required", description: "Scheduling interview with candidate", color: "bg-orange-500" },
  { key: "interview_completed", label: "Interview Completed", description: "Awaiting interview panel feedback", color: "bg-teal-500" },
  { key: "offer_generation", label: "Offer Generation", description: "Drafting admission offer letter", color: "bg-indigo-500" },
  { key: "conditional_offer", label: "Conditional Offer", description: "Offer sent with conditions to fulfill", color: "bg-yellow-500" },
  { key: "unconditional_offer", label: "Unconditional Offer", description: "Final offer — all conditions met", color: "bg-emerald-500" },
  { key: "student_accepted", label: "Student Accepted", description: "Student has accepted the offer", color: "bg-green-600" },
  { key: "payment_pending", label: "Payment Pending", description: "Awaiting tuition deposit payment", color: "bg-rose-500" },
  { key: "payment_verified", label: "Payment Verified", description: "Payment confirmed and recorded", color: "bg-green-700" },
  { key: "visa_processing", label: "Visa Processing", description: "Student visa application in progress", color: "bg-purple-500" },
  { key: "enrolled", label: "Enrolled", description: "Student officially enrolled", color: "bg-emerald-700" },
  { key: "completed", label: "Completed", description: "Admission cycle complete", color: "bg-emerald-900", terminal: true },
];

export const STAGE_KEYS = STAGES.map((s) => s.key);

export const OFFER_STAGES = ["conditional_offer", "unconditional_offer"];

export function stageOf(key: string): Stage {
  return STAGES.find((s) => s.key === key) ?? STAGES[0];
}

export function stageIndex(key: string): number {
  const i = STAGES.findIndex((s) => s.key === key);
  return i === -1 ? 0 : i;
}

export function stageProgress(key: string): number {
  return Math.floor((stageIndex(key) / (STAGES.length - 1)) * 100);
}
