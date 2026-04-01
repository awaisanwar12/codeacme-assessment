// prisma/seed.ts
// Database seeding script - creates admin user and sample data
import { PrismaClient, UserRole, BriefStage, BudgetRange } from '@prisma/client';
import { hashPassword } from '../src/lib/hash';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

  console.log('Creating admin user...');
  const adminPasswordHash = await hashPassword(adminPassword);
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin user: ${adminUser.email}`);

  // Create reviewer user
  console.log('Creating reviewer user...');
  const reviewerPassword = await hashPassword('ReviewerPass123!');
  
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      passwordHash: reviewerPassword,
      name: 'Test Reviewer',
      role: UserRole.REVIEWER,
    },
  });
  console.log(`✅ Reviewer user: ${reviewer.email}`);

  // Sample briefs for different stages and categories
  const sampleBriefs = [
    {
      title: 'E-commerce Platform Redesign',
      description: 'Client wants a complete overhaul of their existing e-commerce platform. Currently on Shopify but wants to migrate to a custom Next.js solution with Stripe integration. Key features needed: product catalog with filtering, shopping cart, user accounts with order history, wishlist, product reviews, inventory management dashboard, shipping integration with FedEx/UPS APIs, email notifications for order confirmations and shipping updates. They also want analytics dashboard showing sales trends, popular products, and customer behavior. Mobile-first design is critical.',
      budgetRange: BudgetRange.TWENTY_FIVE_TO_50K,
      contactName: 'John Smith',
      contactEmail: 'john@techstartup.com',
      contactPhone: '+1-555-123-4567',
      companyName: 'TechStartup Inc',
      stage: BriefStage.NEW,
    },
    {
      title: 'Healthcare Appointment Scheduling System',
      description: 'Development of a secure HIPAA-compliant appointment scheduling platform for a multi-location clinic network. Features: patient portal (book/reschedule/cancel appointments, view medical records, fill out intake forms), provider portal (manage availability, view daily schedule, patient notes), automated reminders via SMS and email, waitlist management for fully booked slots, insurance verification integration, calendar sync with Google/Outlook, reporting dashboard for no-show rates, revenue by provider. Need to integrate with existing Epic EHR system via HL7/FHIR APIs.',
      budgetRange: BudgetRange.FIFTY_TO_100K,
      contactName: 'Dr. Sarah Chen',
      contactEmail: 'schen@healthclinic.com',
      companyName: 'HealthClinic Partners',
      stage: BriefStage.UNDER_REVIEW,
    },
    {
      title: 'AI-Powered Content Generation Platform',
      description: 'SaaS platform for marketing teams to generate on-brand content using AI. Core features: brand voice training (upload existing content to fine-tune output), multi-format content generation (blog posts, social media, email campaigns, ad copy), collaborative editing workflow with approval processes, content calendar integration, plagiarism checking, SEO optimization suggestions, performance analytics. Multi-tenant architecture with role-based access control. API for integration with existing marketing tools.',
      budgetRange: BudgetRange.FIFTY_TO_100K,
      contactName: 'Mike Rodriguez',
      contactEmail: 'mike@contentagency.io',
      companyName: 'ContentCraft Agency',
      stage: BriefStage.PROPOSAL_SENT,
    },
    {
      title: 'Warehouse Inventory Automation',
      description: 'Automated inventory management system for a distribution warehouse. Need barcode/RFID scanning integration, real-time stock tracking, automated reorder alerts, predictive demand forecasting using ML, integration with existing ERP system (NetSuite), mobile app for warehouse workers, dashboard for managers showing KPIs (turnover rate, stock accuracy, picking efficiency). Must handle 50,000+ SKUs across multiple warehouses.',
      budgetRange: BudgetRange.TEN_TO_25K,
      contactName: 'Lisa Park',
      contactEmail: 'lpark@logisticspro.com',
      companyName: 'LogisticsPro Corp',
      stage: BriefStage.NEW,
    },
    {
      title: 'Membership Management Portal',
      description: 'Online membership portal for a professional association with 10,000+ members. Features: member directory with advanced search, event registration and ticketing, continuing education tracking, certification management, community forum, resource library with document sharing, job board, newsletter management, dues payment processing, tiered membership levels with different access permissions. Need to migrate existing member data from spreadsheets.',
      budgetRange: BudgetRange.FIVE_TO_10K,
      contactName: 'Robert Williams',
      contactEmail: 'rwilliams@association.org',
      companyName: 'Professional Association',
      stage: BriefStage.NEW,
    },
    {
      title: 'Custom CRM with Pipeline Management',
      description: 'Building a custom CRM for a B2B sales team. Deal pipeline with drag-and-drop stages, contact management, company profiles, email integration (send/receive from CRM, templates), call logging, activity timeline, sales forecasting, team performance dashboards, automated follow-up reminders, document management for proposals and contracts. Should integrate with their existing Gmail and Microsoft 365 setup.',
      budgetRange: BudgetRange.TEN_TO_25K,
      contactName: 'Amy Foster',
      contactEmail: 'amy@salessolutions.com',
      companyName: 'Sales Solutions Ltd',
      stage: BriefStage.WON,
    },
  ];

  console.log('\nCreating sample briefs...');
  
  for (const brief of sampleBriefs) {
    const created = await prisma.brief.create({
      data: brief,
    });
    console.log(`  📋 Brief: "${brief.title}" (${brief.stage})`);

    // Create stage event for initial stage
    await prisma.stageEvent.create({
      data: {
        briefId: created.id,
        userId: adminUser.id,
        fromStage: BriefStage.NEW,
        toStage: brief.stage,
        reason: 'Initial setup',
      },
    });
  }

  // Create a sample note thread for one of the briefs
  const firstBrief = await prisma.brief.findFirst({
    where: { stage: BriefStage.UNDER_REVIEW },
  });

  if (firstBrief) {
    console.log('\nCreating sample notes...');
    
    const note1 = await prisma.note.create({
      data: {
        briefId: firstBrief.id,
        userId: adminUser.id,
        content: 'This looks promising. The scope is significant but the budget aligns with enterprise work. Let\'s schedule a discovery call.',
      },
    });

    await prisma.note.create({
      data: {
        briefId: firstBrief.id,
        userId: reviewer.id,
        content: 'Agreed. I\'ll reach out to set up the call.',
        parentId: note1.id,
      },
    });
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log(`\n📧 Admin login: admin@example.com / ${process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!'}`);
  console.log(`📧 Reviewer login: reviewer@example.com / ReviewerPass123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });