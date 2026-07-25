import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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


  const demoUni = await prisma.university.findFirst();
  if (demoUni) {
    const uniPass = await bcrypt.hash("uni123", 10);
    await prisma.user.upsert({
      where: { email: "university@demo.com" },
      update: { role: "UNIVERSITY", universityId: demoUni.id },
      create: {
        name: "Admissions Office",
        email: "university@demo.com",
        passwordHash: uniPass,
        role: "UNIVERSITY",
        universityId: demoUni.id,
      },
    });
    console.log(`✓ University login: university@demo.com / uni123 (${demoUni.name})`);
  }

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
