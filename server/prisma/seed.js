const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.dispatchItem.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.enquiryItem.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@udyam.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sales Executive',
      email: 'sales@udyam.local',
      passwordHash: salesPasswordHash,
      role: 'SALES_USER',
    },
  });

  console.log('✅ Seeded Users:');
  console.log(`   - Admin: ${admin.email} (role: ${admin.role})`);
  console.log(`   - Sales: ${salesUser.email} (role: ${salesUser.role})`);

  // 3. Seed Customers
  const customersData = [
    {
      companyName: 'Apex Heavy Engineering Ltd',
      contactPerson: 'Rajesh Sharma',
      mobile: '+91 98765 43210',
      email: 'rajesh@apexeng.com',
      city: 'Pune',
    },
    {
      companyName: 'Bharat Manufacturing Corp',
      contactPerson: 'Sunita Patil',
      mobile: '+91 98220 11223',
      email: 'sunita@bharatmfg.com',
      city: 'Ahmedabad',
    },
    {
      companyName: 'Zenith Automation Systems',
      contactPerson: 'Vikram Desai',
      mobile: '+91 99887 76655',
      email: 'vikram@zenithauto.in',
      city: 'Bengaluru',
    },
    {
      companyName: 'Shakti Infrastructure Ltd',
      contactPerson: 'Anil Mehta',
      mobile: '+91 91234 56789',
      email: 'anil@shaktiinfra.com',
      city: 'Hyderabad',
    },
  ];

  const customers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    customers.push(cust);
  }
  console.log(`✅ Seeded ${customers.length} Customers`);

  // 4. Seed Products with Inventory (from HLD Section 31)
  const productsData = [
    {
      productCode: 'IND-001',
      productName: 'Industrial Gear Motor',
      category: 'Mechanical',
      unit: 'Unit',
      basePrice: 12500.0,
      physicalQuantity: 100,
      reservedQuantity: 0,
    },
    {
      productCode: 'IND-002',
      productName: 'Hydraulic Pump',
      category: 'Hydraulic',
      unit: 'Unit',
      basePrice: 8200.0,
      physicalQuantity: 80,
      reservedQuantity: 0,
    },
    {
      productCode: 'IND-003',
      productName: 'Conveyor Belt',
      category: 'Material Handling',
      unit: 'Meter',
      basePrice: 1450.0,
      physicalQuantity: 250,
      reservedQuantity: 0,
    },
    {
      productCode: 'IND-004',
      productName: 'Industrial Bearing',
      category: 'Mechanical',
      unit: 'Unit',
      basePrice: 650.0,
      physicalQuantity: 500,
      reservedQuantity: 0,
    },
    {
      productCode: 'IND-005',
      productName: 'Pneumatic Cylinder',
      category: 'Pneumatic',
      unit: 'Unit',
      basePrice: 3200.0,
      physicalQuantity: 120,
      reservedQuantity: 0,
    },
    {
      productCode: 'IND-006',
      productName: 'Steel Coupling',
      category: 'Mechanical',
      unit: 'Unit',
      basePrice: 950.0,
      physicalQuantity: 300,
      reservedQuantity: 0,
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const { physicalQuantity, reservedQuantity, ...productFields } = p;
    const prod = await prisma.product.create({
      data: {
        ...productFields,
        inventory: {
          create: {
            physicalQuantity,
            reservedQuantity,
          },
        },
      },
    });
    createdProducts.push(prod);
    console.log(`   - Seeded ${prod.productCode}: ${prod.productName} [Physical: ${physicalQuantity}, Available: ${physicalQuantity}]`);
  }

  // 5. Seed an initial sample workflow (Enquiry -> Quotation) for easy demo
  const sampleEnquiry = await prisma.enquiry.create({
    data: {
      enquiryNumber: 'ENQ-2026-0001',
      customerId: customers[0].id,
      notes: 'Initial requirement for assembly line upgrade',
      status: 'QUOTED',
      createdById: salesUser.id,
      items: {
        create: [
          { productId: createdProducts[0].id, quantity: 5 },
          { productId: createdProducts[1].id, quantity: 2 },
        ],
      },
    },
  });

  // Calculate quotation items
  // Item 1: 5 x 12500 = 62500, disc 5% = 3125, after disc = 59375, gst 18% = 10687.5, line = 70062.5
  // Item 2: 2 x 8200 = 16400, disc 0% = 0, after disc = 16400, gst 18% = 2952, line = 19352
  // Total = 89414.5
  await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2026-0001',
      enquiryId: sampleEnquiry.id,
      customerId: customers[0].id,
      status: 'ACCEPTED',
      totalAmount: 89414.5,
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 5,
            unitPrice: 12500.0,
            discountPercent: 5.0,
            gstPercent: 18.0,
            lineAmount: 70062.5,
          },
          {
            productId: createdProducts[1].id,
            quantity: 2,
            unitPrice: 8200.0,
            discountPercent: 0.0,
            gstPercent: 18.0,
            lineAmount: 19352.0,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded Sample Enquiry ENQ-2026-0001 & ACCEPTED Quotation QTN-2026-0001');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
