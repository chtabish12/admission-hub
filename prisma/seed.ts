import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const universities = [
  {
    name: "Massachusetts Institute of Technology",
    country: "USA",
    city: "Cambridge",
    ranking: 1,
    description:
      "World-leading institute for science, engineering and technology, renowned for research, innovation and entrepreneurship.",
    fields: ["Computer Science", "Engineering", "Physics", "Mathematics", "Business"],
    tuitionMin: 53000,
    tuitionMax: 58000,
    currency: "USD",
    acceptanceRate: 4,
    website: "https://web.mit.edu",
    imageUrl:
      "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=900&q=80",
    requirements: [
      "High school transcript with strong STEM grades",
      "SAT/ACT scores (optional for some cycles)",
      "TOEFL/IELTS for international students",
      "Two letters of recommendation",
      "Personal essays",
    ],
    applicationSteps: [
      { title: "Create application account", description: "Register on the MIT applicant portal." },
      { title: "Submit transcripts & scores", description: "Upload academic records and standardized tests." },
      { title: "Write essays", description: "Complete the required short-answer essays." },
      { title: "Recommendations", description: "Request two teacher recommendations." },
      { title: "Pay application fee", description: "Submit the $75 fee or request a waiver." },
    ],
    deadlines: [
      { term: "Early Action", date: "Nov 1" },
      { term: "Regular Decision", date: "Jan 5" },
    ],
  },
  {
    name: "University of Oxford",
    country: "UK",
    city: "Oxford",
    ranking: 2,
    description:
      "The oldest university in the English-speaking world, offering tutorial-based teaching across humanities and sciences.",
    fields: ["Medicine", "Law", "Computer Science", "Business", "Humanities", "Physics"],
    tuitionMin: 33000,
    tuitionMax: 48000,
    currency: "GBP",
    acceptanceRate: 17,
    website: "https://www.ox.ac.uk",
    imageUrl:
      "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=900&q=80",
    requirements: [
      "A-levels / IB or equivalent",
      "Admissions test (varies by course)",
      "Written work samples (some courses)",
      "Personal statement",
      "Interview",
    ],
    applicationSteps: [
      { title: "Choose course & college", description: "Select your subject and (optionally) a college." },
      { title: "Submit UCAS application", description: "Apply via UCAS by the October deadline." },
      { title: "Take admissions test", description: "Register and sit the required test." },
      { title: "Submit written work", description: "Send samples if your course requires them." },
      { title: "Attend interview", description: "Shortlisted applicants are invited to interview." },
    ],
    deadlines: [{ term: "UCAS Deadline", date: "Oct 15" }],
  },
  {
    name: "National University of Singapore",
    country: "Singapore",
    city: "Singapore",
    ranking: 8,
    description:
      "Asia's leading global university, strong in engineering, computing, business and medicine.",
    fields: ["Computer Science", "Engineering", "Business", "Medicine", "Design"],
    tuitionMin: 17000,
    tuitionMax: 38000,
    currency: "USD",
    acceptanceRate: 5,
    website: "https://www.nus.edu.sg",
    imageUrl:
      "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=900&q=80",
    requirements: [
      "High school diploma / A-levels / IB",
      "SAT or equivalent",
      "English proficiency proof",
      "Statement of purpose",
    ],
    applicationSteps: [
      { title: "Online application", description: "Apply through the NUS applicant portal." },
      { title: "Upload documents", description: "Transcripts, test scores and certificates." },
      { title: "Pay application fee", description: "Submit the non-refundable fee." },
      { title: "Await offer", description: "Track your application status online." },
    ],
    deadlines: [{ term: "International", date: "Feb 21" }],
  },
  {
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    ranking: 21,
    description:
      "Canada's top research university with a vast range of programs and a vibrant, diverse campus.",
    fields: ["Computer Science", "Business", "Engineering", "Medicine", "Arts", "Data Science"],
    tuitionMin: 45000,
    tuitionMax: 62000,
    currency: "CAD",
    acceptanceRate: 43,
    website: "https://www.utoronto.ca",
    imageUrl:
      "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=900&q=80",
    requirements: [
      "High school transcript",
      "English proficiency (TOEFL/IELTS)",
      "Supplementary application (some programs)",
      "Statement of interest",
    ],
    applicationSteps: [
      { title: "Apply via OUAC", description: "Submit the Ontario universities application." },
      { title: "Create JOIN U of T account", description: "Track documents and requirements." },
      { title: "Upload transcripts", description: "Provide academic records." },
      { title: "Complete supplements", description: "Finish program-specific applications." },
    ],
    deadlines: [{ term: "International", date: "Jan 15" }],
  },
  {
    name: "Technical University of Munich",
    country: "Germany",
    city: "Munich",
    ranking: 28,
    description:
      "One of Europe's top technical universities with low tuition and strong industry links.",
    fields: ["Engineering", "Computer Science", "Physics", "Data Science", "Business"],
    tuitionMin: 0,
    tuitionMax: 6000,
    currency: "EUR",
    acceptanceRate: 8,
    website: "https://www.tum.de",
    imageUrl:
      "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=900&q=80",
    requirements: [
      "Recognized secondary school certificate",
      "German or English proficiency (program dependent)",
      "Aptitude assessment (some programs)",
      "Motivation letter",
    ],
    applicationSteps: [
      { title: "Check program requirements", description: "Verify eligibility for your chosen program." },
      { title: "Apply via TUMonline", description: "Create an account and submit the application." },
      { title: "Send certified documents", description: "Provide certified copies as required." },
      { title: "Aptitude assessment", description: "Complete interviews/tests if required." },
    ],
    deadlines: [{ term: "Winter Semester", date: "May 31" }],
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    ranking: 14,
    description:
      "Australia's leading university, consistently ranked top globally for graduate employability.",
    fields: ["Business", "Medicine", "Law", "Computer Science", "Arts", "Engineering"],
    tuitionMin: 31000,
    tuitionMax: 50000,
    currency: "AUD",
    acceptanceRate: 70,
    website: "https://www.unimelb.edu.au",
    imageUrl:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&q=80",
    requirements: [
      "Senior secondary certificate / equivalent",
      "English language requirement",
      "Prerequisite subjects (course dependent)",
      "Personal statement",
    ],
    applicationSteps: [
      { title: "Choose your course", description: "Browse and select a program." },
      { title: "Apply online", description: "Submit through the university portal." },
      { title: "Upload documents", description: "Academic and English test results." },
      { title: "Accept offer", description: "Confirm your place and pay deposit." },
    ],
    deadlines: [{ term: "Semester 1", date: "Oct 31" }],
  },
  {
    name: "Lahore University of Management Sciences",
    country: "Pakistan",
    city: "Lahore",
    ranking: 120,
    description:
      "Pakistan's premier private university, strong in business, computer science and social sciences.",
    fields: ["Business", "Computer Science", "Engineering", "Economics", "Law"],
    tuitionMin: 7000,
    tuitionMax: 12000,
    currency: "USD",
    acceptanceRate: 14,
    website: "https://lums.edu.pk",
    imageUrl:
      "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=900&q=80",
    requirements: [
      "HSSC / A-levels / equivalent",
      "LUMS admission test (SSE/SAT)",
      "Statement of purpose",
      "Reference letters",
    ],
    applicationSteps: [
      { title: "Online application", description: "Register and complete the LUMS form." },
      { title: "Register for test", description: "Sit the LUMS aptitude test or submit SAT." },
      { title: "Submit documents", description: "Transcripts and supporting material." },
      { title: "Financial aid (optional)", description: "Apply for need-based aid." },
    ],
    deadlines: [{ term: "Fall Intake", date: "Jan 31" }],
  },
  {
    name: "ETH Zurich",
    country: "Switzerland",
    city: "Zurich",
    ranking: 7,
    description:
      "A global leader in science and technology education with world-class research facilities.",
    fields: ["Engineering", "Computer Science", "Physics", "Mathematics", "Data Science"],
    tuitionMin: 1500,
    tuitionMax: 2000,
    currency: "CHF",
    acceptanceRate: 27,
    website: "https://ethz.ch",
    imageUrl:
      "https://images.unsplash.com/photo-1527269534026-c86f4009eace?w=900&q=80",
    requirements: [
      "Recognized secondary diploma",
      "Entrance exam (some applicants)",
      "German/English proficiency",
      "Motivation letter",
    ],
    applicationSteps: [
      { title: "Verify admission category", description: "Determine your eligibility route." },
      { title: "Apply online", description: "Submit your application before the deadline." },
      { title: "Send documents", description: "Certified records by post if required." },
      { title: "Entrance exam", description: "Sit the exam if applicable." },
    ],
    deadlines: [{ term: "Autumn Semester", date: "Apr 30" }],
  },
];

const consultants = [
  {
    name: "Ayesha Khan",
    email: "ayesha@globaledu.com",
    company: "GlobalEdu Advisors",
    country: "Pakistan",
    city: "Lahore",
    specialties: ["USA", "UK", "Canada"],
    fields: ["Computer Science", "Business", "Engineering"],
    bio: "10+ years helping students secure admissions and scholarships in top US & UK universities.",
    rating: 4.9,
    reviews: 214,
    approved: true,
    source: "PLATFORM",
    website: "https://globaledu.com",
    phone: "+92 300 1234567",
    imageUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    name: "James Carter",
    email: "james@brightfuture.co.uk",
    company: "BrightFuture Consulting",
    country: "UK",
    city: "London",
    specialties: ["UK", "Germany", "Australia"],
    fields: ["Medicine", "Law", "Humanities"],
    bio: "Specialist in UK UCAS applications, Oxbridge interviews and European medical schools.",
    rating: 4.8,
    reviews: 178,
    approved: true,
    source: "PLATFORM",
    website: "https://brightfuture.co.uk",
    phone: "+44 20 7946 0000",
    imageUrl: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Mei Lin",
    email: "mei@asiapathways.sg",
    company: "Asia Pathways",
    country: "Singapore",
    city: "Singapore",
    specialties: ["Singapore", "Australia", "USA"],
    fields: ["Business", "Data Science", "Design"],
    bio: "Guiding students into NUS, NTU and top Australian universities for over 8 years.",
    rating: 4.7,
    reviews: 96,
    approved: true,
    source: "PLATFORM",
    website: "https://asiapathways.sg",
    phone: "+65 6123 4567",
    imageUrl: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Daniel Müller",
    email: "daniel@studyingermany.de",
    company: "Study-in-Germany",
    country: "Germany",
    city: "Berlin",
    specialties: ["Germany", "Switzerland", "Netherlands"],
    fields: ["Engineering", "Computer Science", "Physics"],
    bio: "Expert in low-cost German public universities, blocked accounts and student visas.",
    rating: 4.9,
    reviews: 142,
    approved: true,
    source: "PLATFORM",
    website: "https://studyingermany.de",
    phone: "+49 30 1234567",
    imageUrl: "https://i.pravatar.cc/150?img=15",
  },
  {
    name: "Sara Ahmed",
    company: "Maple Leaf Education",
    country: "Canada",
    city: "Toronto",
    specialties: ["Canada", "USA"],
    fields: ["Business", "Engineering", "Arts"],
    bio: "Helping international students navigate Canadian admissions and PR pathways.",
    rating: 4.6,
    reviews: 67,
    approved: true,
    source: "PLATFORM",
    website: "https://mapleleafedu.ca",
    phone: "+1 416 555 0199",
    imageUrl: "https://i.pravatar.cc/150?img=45",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Demo accounts
  const studentPass = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "student@demo.com" },
    update: {},
    create: {
      name: "Demo Student",
      email: "student@demo.com",
      passwordHash: studentPass,
      role: "STUDENT",
      fieldOfInterest: "Computer Science",
      preferredCountry: "USA",
      educationLevel: "High School",
    },
  });

  const adminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Platform Admin",
      email: "admin@demo.com",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  await prisma.university.deleteMany();
  for (const u of universities) {
    await prisma.university.create({
      data: {
        ...u,
        fields: JSON.stringify(u.fields),
        requirements: JSON.stringify(u.requirements),
        applicationSteps: JSON.stringify(u.applicationSteps),
        deadlines: JSON.stringify(u.deadlines),
      },
    });
  }
  console.log(`✓ Seeded ${universities.length} universities`);

  await prisma.consultant.deleteMany({ where: { source: "PLATFORM" } });
  for (const c of consultants) {
    await prisma.consultant.create({
      data: {
        ...c,
        specialties: JSON.stringify(c.specialties),
        fields: JSON.stringify(c.fields),
      },
    });
  }
  console.log(`✓ Seeded ${consultants.length} consultants`);

  console.log("✅ Done.");
  console.log("   Student login: student@demo.com / password123");
  console.log("   Admin login:   admin@demo.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
