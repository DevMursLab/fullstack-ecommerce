// Demo data seeder — populates the database with realistic services, staff,
// products, an admin/customer account, sample bookings, reviews and coupons
// so a fresh deploy never shows an empty site to a client or reviewer.
//
// Usage: node utils/seed.js          (adds demo data, skips if already seeded)
//        node utils/seed.js --reset  (wipes these collections first, then reseeds)

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Product = require('../models/Product');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');

const STAFF_DATA = [
  {
    name: 'Aisha Rahman', photo: 'assets/images/staff-aisha.svg',
    specialty: ['Hair Cutting', 'Hair Coloring', 'Keratin Treatment'],
    bio: 'Senior stylist with 10+ years crafting signature cuts and color transformations.',
    experience: 10, rating: 4.9, reviewCount: 92, commissionRate: 0.35,
    workingHours: {
      monday: { start: '10:00', end: '19:00', isOff: false },
      tuesday: { start: '10:00', end: '19:00', isOff: false },
      wednesday: { start: '10:00', end: '19:00', isOff: false },
      thursday: { start: '10:00', end: '19:00', isOff: false },
      friday: { start: '10:00', end: '20:00', isOff: false },
      saturday: { start: '10:00', end: '20:00', isOff: false },
      sunday: { start: '00:00', end: '00:00', isOff: true },
    },
    leaves: [{ date: '2026-08-20', reason: 'Personal' }],
  },
  {
    name: 'Farhan Chowdhury', photo: 'assets/images/staff-farhan.svg',
    specialty: ['Facial', 'Skin Treatment', 'Anti-Aging Facial'],
    bio: 'Certified skin therapist specializing in facials and rejuvenation treatments.',
    experience: 7, rating: 4.8, reviewCount: 61, commissionRate: 0.3,
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOff: false },
      tuesday: { start: '09:00', end: '18:00', isOff: false },
      wednesday: { start: '09:00', end: '18:00', isOff: false },
      thursday: { start: '00:00', end: '00:00', isOff: true },
      friday: { start: '09:00', end: '18:00', isOff: false },
      saturday: { start: '09:00', end: '18:00', isOff: false },
      sunday: { start: '09:00', end: '17:00', isOff: false },
    },
    leaves: [],
  },
  {
    name: 'Nusrat Jahan', photo: 'assets/images/staff-nusrat.svg',
    specialty: ['Manicure', 'Pedicure', 'Gel Nails'],
    bio: 'Nail artist known for precise, long-lasting gel and acrylic designs.',
    experience: 5, rating: 4.7, reviewCount: 74, commissionRate: 0.3,
    workingHours: {
      monday: { start: '10:00', end: '19:00', isOff: false },
      tuesday: { start: '10:00', end: '19:00', isOff: false },
      wednesday: { start: '10:00', end: '19:00', isOff: false },
      thursday: { start: '10:00', end: '19:00', isOff: false },
      friday: { start: '10:00', end: '19:00', isOff: false },
      saturday: { start: '00:00', end: '00:00', isOff: true },
      sunday: { start: '10:00', end: '18:00', isOff: false },
    },
    leaves: [{ date: '2026-08-15', reason: 'Personal' }],
  },
  {
    name: 'Tanvir Ahmed', photo: 'assets/images/staff-tanvir.svg',
    specialty: ['Swedish Massage', 'Deep Tissue Massage'],
    bio: 'Licensed massage therapist focused on relaxation and therapeutic techniques.',
    experience: 8, rating: 4.9, reviewCount: 45, commissionRate: 0.32,
    workingHours: {
      monday: { start: '11:00', end: '20:00', isOff: false },
      tuesday: { start: '11:00', end: '20:00', isOff: false },
      wednesday: { start: '11:00', end: '20:00', isOff: false },
      thursday: { start: '11:00', end: '20:00', isOff: false },
      friday: { start: '11:00', end: '21:00', isOff: false },
      saturday: { start: '11:00', end: '21:00', isOff: false },
      sunday: { start: '00:00', end: '00:00', isOff: true },
    },
    leaves: [],
  },
  {
    name: 'Sadia Islam', photo: 'assets/images/staff-sadia.svg',
    specialty: ['Bridal Package', 'Hair Coloring', 'Facial'],
    bio: 'Bridal specialist delivering flawless looks for the most important day.',
    experience: 9, rating: 5.0, reviewCount: 38, commissionRate: 0.4,
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOff: false },
      tuesday: { start: '09:00', end: '18:00', isOff: false },
      wednesday: { start: '00:00', end: '00:00', isOff: true },
      thursday: { start: '09:00', end: '18:00', isOff: false },
      friday: { start: '09:00', end: '19:00', isOff: false },
      saturday: { start: '09:00', end: '19:00', isOff: false },
      sunday: { start: '09:00', end: '18:00', isOff: false },
    },
    leaves: [{ date: '2026-08-25', reason: 'Personal' }],
  },
];

// Services reference staff by array index into STAFF_DATA — resolved to real
// ObjectIds after staff are inserted.
const SERVICE_DATA = [
  { name: 'Hair Cut & Style', slug: 'hair-cut-style', category: 'Hair', duration: 45, bufferTime: 15, price: 800, memberPrice: 700, description: 'A precision cut tailored to your face shape, finished with a professional blow-dry style.', shortDescription: 'Precision cut & professional styling', image: 'assets/images/service-haircut.svg', addOns: [{ name: 'Deep Conditioning', price: 300, duration: 15 }, { name: 'Scalp Massage', price: 250, duration: 10 }], staffIdx: [0, 4], bookingCount: 142 },
  { name: 'Hair Coloring', slug: 'hair-coloring', category: 'Hair', duration: 120, bufferTime: 15, price: 3500, memberPrice: 3100, description: 'Full hair coloring service using premium ammonia-free color, includes consultation and gloss finish.', shortDescription: 'Full color transformation', image: 'assets/images/service-coloring.svg', addOns: [{ name: 'Highlights', price: 1200, duration: 45 }, { name: 'Toner', price: 500, duration: 20 }], staffIdx: [0, 4], bookingCount: 98 },
  { name: 'Keratin Treatment', slug: 'keratin-treatment', category: 'Hair', duration: 150, bufferTime: 20, price: 6000, memberPrice: 5400, description: 'Smoothing keratin treatment that eliminates frizz and adds long-lasting shine for up to 5 months.', shortDescription: 'Frizz-free smoothing treatment', image: 'assets/images/service-keratin.svg', addOns: [], staffIdx: [0], bookingCount: 51 },
  { name: 'Facial Cleanup', slug: 'facial-cleanup', category: 'Skin', duration: 40, bufferTime: 10, price: 900, memberPrice: 800, description: 'Deep cleansing facial with steam, extraction, and hydrating mask to refresh your skin.', shortDescription: 'Deep cleanse & refresh', image: 'assets/images/service-facial.svg', addOns: [{ name: 'Gold Mask', price: 400, duration: 15 }], staffIdx: [1], bookingCount: 121 },
  { name: 'Anti-Aging Facial', slug: 'anti-aging-facial', category: 'Skin', duration: 60, bufferTime: 15, price: 2200, memberPrice: 1950, description: 'Collagen-boosting facial targeting fine lines with LED therapy and peptide serums.', shortDescription: 'Collagen-boosting rejuvenation', image: 'assets/images/service-antiaging.svg', addOns: [{ name: 'LED Therapy', price: 600, duration: 20 }], staffIdx: [1], bookingCount: 64 },
  { name: 'Classic Manicure', slug: 'classic-manicure', category: 'Nails', duration: 40, bufferTime: 10, price: 700, memberPrice: 600, description: 'Nail shaping, cuticle care, hand massage, and polish of your choice.', shortDescription: 'Shape, buff & polish', image: 'assets/images/service-manicure.svg', addOns: [{ name: 'Paraffin Wax', price: 300, duration: 15 }], staffIdx: [2], bookingCount: 156 },
  { name: 'Spa Pedicure', slug: 'spa-pedicure', category: 'Nails', duration: 50, bufferTime: 10, price: 900, memberPrice: 800, description: 'Relaxing foot soak, exfoliation, callus removal, massage, and polish.', shortDescription: 'Foot soak, scrub & polish', image: 'assets/images/service-pedicure.svg', addOns: [{ name: 'Paraffin Wax', price: 300, duration: 15 }], staffIdx: [2], bookingCount: 133 },
  { name: 'Gel Nails', slug: 'gel-nails', category: 'Nails', duration: 60, bufferTime: 15, price: 1400, memberPrice: 1250, description: 'Long-lasting gel polish application with UV curing, chip-free for up to 3 weeks.', shortDescription: 'Chip-free gel color', image: 'assets/images/service-gelnails.svg', addOns: [{ name: 'Nail Art (per hand)', price: 250, duration: 15 }], staffIdx: [2], bookingCount: 87 },
  { name: 'Swedish Massage', slug: 'swedish-massage', category: 'Massage', duration: 60, bufferTime: 15, price: 1800, memberPrice: 1600, description: 'Gentle full-body massage using long strokes to relax muscles and improve circulation.', shortDescription: 'Full-body relaxation massage', image: 'assets/images/service-swedish.svg', addOns: [{ name: 'Aromatherapy', price: 300, duration: 0 }], staffIdx: [3], bookingCount: 76 },
  { name: 'Deep Tissue Massage', slug: 'deep-tissue-massage', category: 'Massage', duration: 75, bufferTime: 15, price: 2400, memberPrice: 2100, description: 'Targeted massage using firm pressure to release chronic muscle tension.', shortDescription: 'Firm-pressure therapeutic massage', image: 'assets/images/service-deeptissue.svg', addOns: [{ name: 'Hot Stones', price: 500, duration: 15 }], staffIdx: [3], bookingCount: 59 },
  { name: 'Bridal Package', slug: 'bridal-package', category: 'Package', duration: 240, bufferTime: 30, price: 15000, memberPrice: 13500, description: 'Complete bridal beauty package: hair styling, makeup, facial, manicure and pedicure.', shortDescription: 'Full bridal beauty day', image: 'assets/images/service-bridal.svg', addOns: [{ name: 'Trial Session', price: 2000, duration: 90 }], staffIdx: [4], bookingCount: 34 },
  { name: 'Groom Package', slug: 'groom-package', category: 'Package', duration: 150, bufferTime: 20, price: 6500, memberPrice: 5800, description: 'Grooming package with haircut, facial, and shave for the modern groom.', shortDescription: 'Complete groom prep', image: 'assets/images/service-groom.svg', addOns: [], staffIdx: [0, 1], bookingCount: 28 },
];

const PRODUCT_DATA = [
  { name: 'Argan Oil Shampoo', sku: 'LM-SH-001', brand: 'Lumière Care', category: 'Hair Care', description: 'Sulfate-free shampoo infused with argan oil for smooth, nourished hair.', images: ['assets/images/product-shampoo1.svg'], rating: 4.6, reviewCount: 34, price: 750, originalPrice: 950, variants: [{ name: '250ml', price: 750, stock: 40 }, { name: '500ml', price: 1300, stock: 22 }], stock: 62, isFeatured: true },
  { name: 'Keratin Repair Conditioner', sku: 'LM-CN-002', brand: 'Lumière Care', category: 'Hair Care', description: 'Deep conditioning treatment that repairs damaged, chemically treated hair.', images: ['assets/images/product-conditioner1.svg'], rating: 4.5, reviewCount: 28, price: 850, variants: [{ name: '250ml', price: 850, stock: 35 }], stock: 35, isFeatured: true },
  { name: 'Hydrating Face Serum', sku: 'GL-SR-003', brand: 'GlowLab', category: 'Skin Care', description: 'Hyaluronic acid serum for deep hydration and a dewy glow.', images: ['assets/images/product-serum1.svg'], rating: 4.8, reviewCount: 51, price: 1450, originalPrice: 1800, variants: [{ name: '30ml', price: 1450, stock: 18 }], stock: 18, isFeatured: true },
  { name: 'Vitamin C Brightening Cream', sku: 'GL-CR-004', brand: 'GlowLab', category: 'Skin Care', description: 'Daily moisturizer with vitamin C to brighten and even skin tone.', images: ['assets/images/product-cream1.svg'], rating: 4.4, reviewCount: 19, price: 1200, variants: [{ name: '50g', price: 1200, stock: 26 }], stock: 26, isFeatured: false },
  { name: 'Charcoal Detox Face Wash', sku: 'GL-FW-005', brand: 'GlowLab', category: 'Skin Care', description: 'Deep pore-cleansing face wash with activated charcoal.', images: ['assets/images/product-facewash1.svg'], rating: 4.3, reviewCount: 22, price: 520, originalPrice: 650, variants: [{ name: '150ml', price: 520, stock: 50 }], stock: 50, isFeatured: false },
  { name: 'Gel Nail Polish Set', sku: 'CP-NP-006', brand: 'ColorPop', category: 'Nail Care', description: 'Set of 6 long-wear gel nail polishes in trending shades.', images: ['assets/images/product-nailset1.svg'], rating: 4.7, reviewCount: 40, price: 1800, originalPrice: 2200, variants: [{ name: 'Set of 6', price: 1800, stock: 15 }], stock: 15, isFeatured: true },
  { name: 'Cuticle Oil Pen', sku: 'CP-CO-007', brand: 'ColorPop', category: 'Nail Care', description: 'Nourishing cuticle oil in a convenient click pen applicator.', images: ['assets/images/product-cuticleoil1.svg'], rating: 4.2, reviewCount: 12, price: 380, variants: [{ name: '5ml', price: 380, stock: 60 }], stock: 60, isFeatured: false },
  { name: 'Professional Hair Dryer', sku: 'SP-HD-008', brand: 'SalonPro', category: 'Tools', description: 'Ionic hair dryer with 3 heat settings for salon-quality blowouts at home.', images: ['assets/images/product-dryer1.svg'], rating: 4.9, reviewCount: 63, price: 4500, originalPrice: 5500, variants: [{ name: 'Standard', price: 4500, stock: 10 }], stock: 10, isFeatured: true },
  { name: 'Ceramic Flat Iron', sku: 'SP-FI-009', brand: 'SalonPro', category: 'Tools', description: 'Ceramic-plated flat iron for smooth, frizz-free styling.', images: ['assets/images/product-flatiron1.svg'], rating: 4.6, reviewCount: 29, price: 2800, variants: [{ name: 'Standard', price: 2800, stock: 14 }], stock: 14, isFeatured: false },
  { name: 'Rose Water Toner', sku: 'GL-TN-010', brand: 'GlowLab', category: 'Skin Care', description: 'Alcohol-free rose water toner to refresh and balance skin.', images: ['assets/images/product-toner1.svg'], rating: 4.5, reviewCount: 17, price: 420, originalPrice: 550, variants: [{ name: '200ml', price: 420, stock: 45 }], stock: 45, isFeatured: false },
  { name: 'Nail Strengthener Base Coat', sku: 'CP-BC-011', brand: 'ColorPop', category: 'Nail Care', description: 'Fortifying base coat that strengthens brittle nails.', images: ['assets/images/product-basecoat1.svg'], rating: 4.3, reviewCount: 9, price: 480, variants: [{ name: '12ml', price: 480, stock: 33 }], stock: 33, isFeatured: false },
  { name: 'Bamboo Hair Brush', sku: 'LM-BR-012', brand: 'Lumière Care', category: 'Tools', description: 'Eco-friendly bamboo brush that reduces static and breakage.', images: ['assets/images/product-brush1.svg'], rating: 4.7, reviewCount: 25, price: 550, originalPrice: 700, variants: [{ name: 'Standard', price: 550, stock: 38 }], stock: 38, isFeatured: false },
  { name: 'Anti-Dandruff Shampoo', sku: 'LM-SH-013', brand: 'Lumière Care', category: 'Hair Care', description: 'Medicated shampoo that controls dandruff and soothes the scalp.', images: ['assets/images/product-shampoo2.svg'], rating: 4.4, reviewCount: 31, price: 680, variants: [{ name: '250ml', price: 680, stock: 42 }], stock: 42, isFeatured: false },
  { name: 'Under-Eye Gel Patches', sku: 'GL-EP-014', brand: 'GlowLab', category: 'Skin Care', description: 'Cooling collagen gel patches to reduce puffiness and dark circles.', images: ['assets/images/product-eyepatch1.svg'], rating: 4.6, reviewCount: 44, price: 690, originalPrice: 900, variants: [{ name: 'Pack of 5', price: 690, stock: 28 }], stock: 28, isFeatured: true },
  { name: 'Nail File & Buffer Kit', sku: 'CP-NK-015', brand: 'ColorPop', category: 'Nail Care', description: 'Complete 4-way nail file and buffer set for salon-finish nails.', images: ['assets/images/product-nailkit1.svg'], rating: 4.1, reviewCount: 14, price: 320, variants: [{ name: 'Kit', price: 320, stock: 55 }], stock: 55, isFeatured: false },
];

const CUSTOMER_DATA = [
  { name: 'Farzana Karim', email: 'farzana@example.com' },
  { name: 'Rakib Hasan', email: 'rakib@example.com' },
  { name: 'Meherun Nesa', email: 'meherun@example.com' },
  { name: 'Tanjina Sultana', email: 'tanjina@example.com' },
  { name: 'Nabila Rahman', email: 'nabila@example.com' },
];

const COUPON_DATA = [
  { code: 'FIRST10', type: 'percentage', value: 10, appliesTo: 'both', minPurchase: 0, usageLimit: 500, perUserLimit: 1, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01') },
  { code: 'WELCOME500', type: 'fixed', value: 500, appliesTo: 'order', minPurchase: 3000, usageLimit: 200, perUserLimit: 1, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01') },
  { code: 'SAVE15', type: 'percentage', value: 15, appliesTo: 'both', minPurchase: 2000, maxDiscount: 1000, usageLimit: 300, perUserLimit: 2, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01') },
];

function daysFromNow(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

async function seed({ reset } = {}) {
  await connectDB();

  const collections = [User, Service, Staff, Product, Appointment, Review, Coupon];

  if (reset) {
    console.log('[seed] --reset passed, clearing existing demo collections...');
    await Promise.all(collections.map((m) => m.deleteMany({})));
  }

  const alreadySeeded = await Service.countDocuments();
  if (alreadySeeded > 0 && !reset) {
    console.log(`[seed] Services collection already has ${alreadySeeded} documents — skipping seed.`);
    console.log('[seed] Run "node utils/seed.js --reset" to wipe and reseed.');
    await mongoose.disconnect();
    return;
  }

  // ---------- Admin + demo customer accounts ----------
  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  const admin = await User.create({
    name: 'Lumière Admin',
    email: 'admin@lumiere-salon.com',
    phone: '+8801700000000',
    password: passwordHash,
    role: 'admin',
  });

  const customers = await User.insertMany(
    CUSTOMER_DATA.map((c) => ({
      name: c.name,
      email: c.email,
      phone: '+88017' + Math.floor(10000000 + Math.random() * 89999999),
      password: passwordHash,
      role: 'customer',
      loyaltyPoints: Math.floor(Math.random() * 500),
    }))
  );

  console.log(`[seed] Created admin (${admin.email}) and ${customers.length} demo customers (password for all: Demo@1234)`);

  // ---------- Staff ----------
  const staff = await Staff.insertMany(STAFF_DATA);
  console.log(`[seed] Created ${staff.length} staff members`);

  // ---------- Services (resolve staffIdx -> real Staff ObjectIds) ----------
  const services = await Service.insertMany(
    SERVICE_DATA.map(({ staffIdx, ...svc }) => ({
      ...svc,
      availableStaff: staffIdx.map((i) => staff[i]._id),
      isActive: true,
    }))
  );
  console.log(`[seed] Created ${services.length} services`);

  // ---------- Products ----------
  const products = await Product.insertMany(
    PRODUCT_DATA.map((p) => ({ ...p, isActive: true }))
  );
  console.log(`[seed] Created ${products.length} products`);

  // ---------- Coupons ----------
  const coupons = await Coupon.insertMany(COUPON_DATA);
  console.log(`[seed] Created ${coupons.length} coupons`);

  // ---------- Sample appointments (mix of past/completed and upcoming) ----------
  const appointmentSeeds = [
    { customer: customers[0], staff: staff[0], service: services[0], date: daysFromNow(-10), startTime: '11:00', status: 'completed' },
    { customer: customers[1], staff: staff[3], service: services[8], date: daysFromNow(-6), startTime: '15:00', status: 'completed' },
    { customer: customers[2], staff: staff[1], service: services[3], date: daysFromNow(-3), startTime: '10:30', status: 'completed' },
    { customer: customers[3], staff: staff[4], service: services[10], date: daysFromNow(-1), startTime: '09:30', status: 'completed' },
    { customer: customers[4], staff: staff[2], service: services[5], date: daysFromNow(2), startTime: '13:00', status: 'confirmed' },
    { customer: customers[0], staff: staff[0], service: services[1], date: daysFromNow(5), startTime: '14:00', status: 'pending' },
  ];

  const appointments = [];
  let bookingSeq = 25001;
  for (const seed of appointmentSeeds) {
    const [h, m] = seed.startTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + seed.service.duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    appointments.push({
      bookingNumber: `LM-${bookingSeq++}`,
      customerId: seed.customer._id,
      staffId: seed.staff._id,
      services: [{ serviceId: seed.service._id, name: seed.service.name, price: seed.service.price, duration: seed.service.duration }],
      addOns: [],
      date: seed.date,
      startTime: seed.startTime,
      endTime,
      startTimeMinutes: startMinutes,
      endTimeMinutes: endMinutes,
      totalDuration: seed.service.duration,
      subtotal: seed.service.price,
      discount: 0,
      total: seed.service.price,
      depositAmount: Math.round(seed.service.price * 0.3),
      paymentOption: 'deposit',
      paymentStatus: seed.status === 'completed' ? 'fully_paid' : 'deposit_paid',
      status: seed.status,
    });
  }
  const createdAppointments = await Appointment.insertMany(appointments);
  console.log(`[seed] Created ${createdAppointments.length} sample appointments`);

  // ---------- Reviews (only for completed appointments -> isVerified: true) ----------
  const reviewSeeds = [
    { type: 'service', ref: services[0]._id, customer: customers[0], rating: 5, title: 'Best haircut in years', comment: 'Aisha really listens to what you want!' },
    { type: 'service', ref: services[8]._id, customer: customers[1], rating: 5, title: 'Incredibly relaxing', comment: 'Tanvir is a true professional, highly recommend the Swedish massage.' },
    { type: 'product', ref: products[2]._id, customer: customers[2], rating: 5, title: 'Skin transformed', comment: 'This serum changed my skin completely within two weeks.' },
    { type: 'staff', ref: staff[4]._id, customer: customers[3], rating: 5, title: 'Flawless bridal look', comment: 'Sadia did my bridal look and I have never felt more beautiful.' },
    { type: 'service', ref: services[3]._id, customer: customers[2], rating: 4, title: 'Fresh and clean', comment: 'My skin felt so fresh after the facial cleanup, will return.' },
    { type: 'product', ref: products[7]._id, customer: customers[1], rating: 5, title: 'Salon results at home', comment: 'Salon-quality results at home, worth every taka.' },
  ];

  const reviews = await Review.insertMany(
    reviewSeeds.map((r) => ({
      type: r.type,
      referenceId: r.ref,
      customerId: r.customer._id,
      customerName: r.customer.name,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerified: true,
      isApproved: true,
    }))
  );
  console.log(`[seed] Created ${reviews.length} reviews`);

  console.log('\n[seed] Done. Demo login credentials:');
  console.log(`  Admin:    ${admin.email} / Demo@1234`);
  console.log(`  Customer: ${customers[0].email} / Demo@1234`);

  await mongoose.disconnect();
}

if (require.main === module) {
  const reset = process.argv.includes('--reset');
  seed({ reset }).catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
