// Shared definition of the step-by-step journey to university.
// Used by the dashboard (progress tracking) and the public "How it works" section.

export type JourneyStep = {
  key: string;
  title: string;
  description: string;
  details: string[];
};

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    key: "explore",
    title: "Discover yourself & your goals",
    description: "Clarify your field of interest, budget and preferred destinations.",
    details: [
      "Pick your area of interest and target degree level",
      "Set a realistic budget and preferred countries/cities",
      "Complete your student profile so we can personalise matches",
    ],
  },
  {
    key: "shortlist",
    title: "Find & shortlist universities",
    description: "Use smart filters to match universities to your profile.",
    details: [
      "Filter by country, city, field and tuition range",
      "Compare rankings, fees and acceptance rates",
      "Save promising universities to your shortlist",
    ],
  },
  {
    key: "requirements",
    title: "Understand requirements",
    description: "Know exactly what each university expects from you.",
    details: [
      "Review academic and language requirements (IELTS/TOEFL)",
      "Check standardized tests (SAT/GRE/GMAT) if required",
      "Note application deadlines for each intake",
    ],
  },
  {
    key: "consultant",
    title: "Connect with a consultant",
    description: "Get expert guidance from approved & verified consultants.",
    details: [
      "Browse approved consultants by country and specialty",
      "Discover nearby consultants sourced from Google",
      "Book a session and get a tailored application plan",
    ],
  },
  {
    key: "documents",
    title: "Prepare your documents",
    description: "Assemble a strong, complete application package.",
    details: [
      "Draft your statement of purpose / personal essays",
      "Gather transcripts and recommendation letters",
      "Prepare your CV and supporting certificates",
    ],
  },
  {
    key: "apply",
    title: "Submit applications",
    description: "Apply to your shortlisted universities with confidence.",
    details: [
      "Complete each university's application form",
      "Upload documents and pay application fees",
      "Track submission status for every university",
    ],
  },
  {
    key: "finance",
    title: "Funding & scholarships",
    description: "Secure scholarships, aid and student finance.",
    details: [
      "Apply for merit and need-based scholarships",
      "Arrange education loans or proof of funds",
      "Plan living costs for your destination city",
    ],
  },
  {
    key: "offer",
    title: "Offer, visa & departure",
    description: "Accept your offer and get ready to fly.",
    details: [
      "Accept your offer and pay the enrollment deposit",
      "Apply for your student visa with required documents",
      "Arrange accommodation, travel and pre-departure essentials",
    ],
  },
];
