import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed profiles (IDs match Supabase Auth pattern for reference)
  const admin1 = await prisma.profile.create({
    data: {
      id: "admin-001",
      name: "Sarah Chen",
      email: "sarah.chen@university.edu",
      department: "Research Operations",
    },
  });
  const admin2 = await prisma.profile.create({
    data: {
      id: "admin-002",
      name: "Marcus Rivera",
      email: "marcus.rivera@university.edu",
      department: "Lab Management",
    },
  });
  const borrower1 = await prisma.profile.create({
    data: {
      id: "borrower-001",
      name: "Emily Park",
      email: "emily.park@university.edu",
      department: "Biology",
    },
  });
  const borrower2 = await prisma.profile.create({
    data: {
      id: "borrower-002",
      name: "James Okonkwo",
      email: "james.okonkwo@university.edu",
      department: "Chemistry",
    },
  });
  const borrower3 = await prisma.profile.create({
    data: {
      id: "borrower-003",
      name: "Aisha Patel",
      email: "aisha.patel@university.edu",
      department: "Physics",
    },
  });
  const borrower4 = await prisma.profile.create({
    data: {
      id: "borrower-004",
      name: "Lucas Fernandez",
      email: "lucas.fernandez@university.edu",
      department: "Environmental Science",
    },
  });

  // Seed roles
  await prisma.userRole.createMany({
    data: [
      { userId: admin1.id, role: "ADMIN" },
      { userId: admin2.id, role: "ADMIN" },
      { userId: borrower1.id, role: "BORROWER" },
      { userId: borrower2.id, role: "BORROWER" },
      { userId: borrower3.id, role: "BORROWER" },
      { userId: borrower4.id, role: "BORROWER" },
    ],
  });

  // Seed tools
  const tools = await Promise.all([
    prisma.tool.create({
      data: {
        name: "Olympus BX53 Microscope",
        description:
          "Advanced research microscope with fluorescence imaging capability",
        category: "Microscopy",
        serialNumber: "MIC-2024-001",
        status: "AVAILABLE",
        location: "Lab A - Room 101",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Thermo Fisher Centrifuge",
        description: "High-speed refrigerated centrifuge for sample preparation",
        category: "Lab Equipment",
        serialNumber: "CNT-2024-002",
        status: "AVAILABLE",
        location: "Lab B - Room 203",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Agilent 1260 HPLC System",
        description: "High-performance liquid chromatography system",
        category: "Analytical",
        serialNumber: "HPLC-2024-003",
        status: "BORROWED",
        location: "Lab C - Room 305",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Eppendorf PCR Thermal Cycler",
        description: "Gradient thermal cycler for DNA amplification",
        category: "Molecular Biology",
        serialNumber: "PCR-2024-004",
        status: "AVAILABLE",
        location: "Lab A - Room 102",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Bruker D8 X-Ray Diffractometer",
        description: "X-ray diffraction system for crystal structure analysis",
        category: "Analytical",
        serialNumber: "XRD-2024-005",
        status: "MAINTENANCE",
        location: "Lab D - Room 401",
      },
    }),
    prisma.tool.create({
      data: {
        name: "ZEISS Axio Zoom Stereo Microscope",
        description: "Stereo zoom microscope for large specimen imaging",
        category: "Microscopy",
        serialNumber: "MIC-2024-006",
        status: "BORROWED",
        location: "Lab A - Room 103",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Bio-Rad Gel Electrophoresis System",
        description: "Horizontal gel electrophoresis unit with power supply",
        category: "Molecular Biology",
        serialNumber: "GEL-2024-007",
        status: "BORROWED",
        location: "Lab B - Room 204",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Shimadzu UV-2600 Spectrophotometer",
        description: "UV-Vis spectrophotometer for absorbance measurements",
        category: "Analytical",
        serialNumber: "UVS-2024-008",
        status: "AVAILABLE",
        location: "Lab C - Room 306",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Nikon Eclipse Ti2 Inverted Microscope",
        description: "Inverted microscope for live-cell imaging",
        category: "Microscopy",
        serialNumber: "MIC-2024-009",
        status: "BORROWED",
        location: "Lab A - Room 104",
      },
    }),
    prisma.tool.create({
      data: {
        name: "Eppendorf Cell Culture Biosafety Cabinet",
        description: "Class II biosafety cabinet for sterile cell culture work",
        category: "Lab Equipment",
        serialNumber: "BSC-2024-010",
        status: "AVAILABLE",
        location: "Lab B - Room 201",
      },
    }),
  ]);

  // Seed bookings
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  await prisma.booking.createMany({
    data: [
      {
        userId: borrower1.id,
        toolId: tools[2].id, // HPLC - BORROWED
        startDate: daysAgo(5),
        endDate: daysFromNow(5),
        purpose:
          "Analyzing water quality samples from field collection study",
        status: "APPROVED",
      },
      {
        userId: borrower2.id,
        toolId: tools[6].id, // Gel Electrophoresis - BORROWED
        startDate: daysAgo(3),
        endDate: daysFromNow(2),
        purpose: "Running protein gels for thesis experiment series",
        status: "APPROVED",
      },
      {
        userId: borrower3.id,
        toolId: tools[0].id, // Olympus Microscope
        startDate: daysFromNow(1),
        endDate: daysFromNow(7),
        purpose: "Examining cell morphology for biology research project",
        status: "PENDING",
      },
      {
        userId: borrower1.id,
        toolId: tools[7].id, // Spectrophotometer
        startDate: daysFromNow(2),
        endDate: daysFromNow(6),
        purpose:
          "Measuring absorbance of prepared chemical samples",
        status: "PENDING",
      },
      {
        userId: borrower4.id,
        toolId: tools[3].id, // PCR Thermal Cycler
        startDate: daysAgo(14),
        endDate: daysAgo(7),
        purpose: "Amplifying environmental DNA samples",
        status: "RETURNED",
        returnDate: daysAgo(7),
      },
      {
        userId: borrower2.id,
        toolId: tools[0].id, // Olympus Microscope
        startDate: daysAgo(21),
        endDate: daysAgo(14),
        purpose: "Observing bacterial cultures for chemistry lab",
        status: "RETURNED",
        returnDate: daysAgo(13),
        adminNotes: "Returned in excellent condition",
      },
      {
        userId: borrower3.id,
        toolId: tools[4].id, // X-Ray Diffractometer - MAINTENANCE
        startDate: daysAgo(10),
        endDate: daysAgo(5),
        purpose: "Crystal structure analysis for materials science project",
        status: "REJECTED",
        adminNotes: "Instrument under scheduled maintenance",
      },
      {
        userId: borrower4.id,
        toolId: tools[7].id, // Spectrophotometer
        startDate: daysAgo(12),
        endDate: daysAgo(5),
        purpose: "UV analysis of soil extract samples",
        status: "RETURNED",
        returnDate: daysAgo(4),
      },
      {
        userId: borrower1.id,
        toolId: tools[8].id, // Nikon Inverted Microscope
        startDate: daysAgo(8),
        endDate: daysAgo(2),
        purpose: "Live-cell imaging time-lapse experiment",
        status: "OVERDUE",
      },
      {
        userId: borrower3.id,
        toolId: tools[1].id, // Centrifuge
        startDate: daysFromNow(3),
        endDate: daysFromNow(8),
        purpose:
          "Separating cell fractions for proteomics analysis",
        status: "PENDING",
      },
      {
        userId: borrower4.id,
        toolId: tools[9].id, // Biosafety Cabinet
        startDate: daysFromNow(5),
        endDate: daysFromNow(12),
        purpose: "Sterile culture work for environmental microbiology",
        status: "PENDING",
      },
      {
        userId: borrower2.id,
        toolId: tools[5].id, // Stereo Microscope
        startDate: daysAgo(6),
        endDate: daysAgo(1),
        purpose: "Dissection and imaging of insect specimens",
        status: "OVERDUE",
        adminNotes: "Please return ASAP — other researchers waiting",
      },
    ],
  });

  console.log("Seed completed:");
  console.log("  6 profiles (2 admins, 4 borrowers)");
  console.log("  6 user roles");
  console.log(`  ${tools.length} tools`);
  console.log("  12 bookings across all statuses");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
