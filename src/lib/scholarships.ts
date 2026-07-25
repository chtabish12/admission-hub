export type Scholarship = {
  id: string;
  name: string;
  university: string;
  country: string;
  funding: string;
  fundingValue: number;
  deadline: string;
  eligibility: string[];
  requirements: string[];
  program: string;
  documentsRequired: string[];
  process: string;
  status: "open" | "closing_soon";
};

export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: "s1",
    name: "Chevening Scholarship",
    university: "UK Government",
    country: "United Kingdom",
    funding: "Full tuition + £18,000 stipend",
    fundingValue: 63000,
    deadline: "2025-11-05",
    eligibility: [
      "2+ years work experience",
      "Leadership qualities",
      "Bachelor's degree",
      "English proficiency",
    ],
    requirements: ["SOP", "4 LORs", "Transcripts", "Leadership essay"],
    program: "Any Master's",
    documentsRequired: [
      "Degree certificate",
      "Transcripts",
      "IELTS/TOEFL",
      "2 References",
      "SOP",
    ],
    process: "Online application → Longlist → Interview → Final selection",
    status: "open",
  },
  {
    id: "s2",
    name: "DAAD EPOS",
    university: "TU Munich",
    country: "Germany",
    funding: "€934/month + tuition",
    fundingValue: 14000,
    deadline: "2025-08-31",
    eligibility: [
      "Bachelor's degree",
      "2 years work experience",
      "Not resident in Germany",
    ],
    requirements: ["SOP", "2 LORs", "Transcripts", "CV"],
    program: "Postgraduate courses",
    documentsRequired: [
      "Degree",
      "Transcripts",
      "Motivation letter",
      "References",
      "CV",
    ],
    process: "Apply via DAAD portal → University nomination → Selection committee",
    status: "closing_soon",
  },
  {
    id: "s3",
    name: "Vanier Canada Graduate",
    university: "University of Toronto",
    country: "Canada",
    funding: "CAD 50,000/year × 3",
    fundingValue: 111000,
    deadline: "2025-11-01",
    eligibility: [
      "Doctoral program",
      "Academic excellence",
      "Research potential",
      "Leadership",
    ],
    requirements: ["Research proposal", "3 LORs", "Transcripts", "SOP"],
    program: "Doctoral",
    documentsRequired: [
      "Research proposal",
      "Transcripts",
      "3 References",
      "Leadership statement",
    ],
    process: "Nomination by university → Vanier committee → Final selection",
    status: "open",
  },
  {
    id: "s4",
    name: "Australia Awards",
    university: "University of Melbourne",
    country: "Australia",
    funding: "Full tuition + AUD 30,000 stipend",
    fundingValue: 62800,
    deadline: "2025-04-30",
    eligibility: [
      "From eligible country",
      "Bachelor's degree",
      "5 years work experience",
      "Return to home country",
    ],
    requirements: ["SOP", "3 LORs", "Transcripts", "Development plan"],
    program: "Master's",
    documentsRequired: [
      "Degree",
      "Transcripts",
      "References",
      "SOP",
      "Development plan",
    ],
    process: "Online application → Longlist → Interview → Selection",
    status: "closing_soon",
  },
  {
    id: "s5",
    name: "ETH Excellence",
    university: "ETH Zurich",
    country: "Switzerland",
    funding: "CHF 12,000/semester + tuition",
    fundingValue: 27460,
    deadline: "2025-03-31",
    eligibility: [
      "Top 10% of bachelor program",
      "Admission to ETH Master's",
    ],
    requirements: ["Pre-proposal", "2 LORs", "Transcripts"],
    program: "Master's",
    documentsRequired: ["Pre-proposal", "Transcripts", "2 References"],
    process: "Apply during Master's application → Department review → Selection",
    status: "open",
  },
  {
    id: "s6",
    name: "Knight-Hennessy Scholars",
    university: "UC Berkeley",
    country: "United States",
    funding: "Full funding for any graduate program",
    fundingValue: 90000,
    deadline: "2025-10-08",
    eligibility: [
      "Bachelor's degree",
      "Apply within 7 years",
      "Leadership",
      "Civic commitment",
    ],
    requirements: ["SOP", "3 LORs", "Transcripts", "Video statement"],
    program: "Any graduate program",
    documentsRequired: [
      "Transcripts",
      "3 References",
      "SOP",
      "Video statement",
      "CV",
    ],
    process: "Application → Longlist → Interview → Final selection",
    status: "open",
  },
];

export type MatchProfile = {
  preferredCountry?: string | null;
  cgpa?: number | null;
  ieltsScore?: number | null;
  workExperience?: number | null;
  budget?: number | null;
};

const COUNTRY_ALIASES: Record<string, string> = {
  UK: "United Kingdom",
  USA: "United States",
};

export function computeMatch(profile: MatchProfile, scholarship: Scholarship): number {
  let score = 20;
  const preferred = profile.preferredCountry
    ? COUNTRY_ALIASES[profile.preferredCountry] ?? profile.preferredCountry
    : null;
  if (preferred && preferred.toLowerCase() === scholarship.country.toLowerCase()) {
    score += 20;
  }
  if ((profile.cgpa ?? 0) >= 3.5) score += 15;
  if ((profile.ieltsScore ?? 0) >= 6.5) score += 15;
  if ((profile.workExperience ?? 0) >= 2) score += 15;
  if (profile.budget != null && scholarship.fundingValue >= profile.budget) score += 10;
  return Math.min(95, Math.max(5, score));
}
