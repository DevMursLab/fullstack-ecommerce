// Mock data — used as offline fallback / seed reference when the backend API is unreachable.

const MOCK_STAFF = [
  {
    _id: 'stf1', name: 'Aisha Rahman', photo: 'assets/images/staff-aisha.svg',
    specialty: ['Hair Cutting', 'Hair Coloring', 'Keratin Treatment'], rating: 4.9, bio: 'Senior stylist with 10+ years crafting signature cuts and color transformations.',
    commissionRate: 0.35,
    workingHours: {
      monday: { start: '10:00', end: '19:00', isOff: false }, tuesday: { start: '10:00', end: '19:00', isOff: false },
      wednesday: { start: '10:00', end: '19:00', isOff: false }, thursday: { start: '10:00', end: '19:00', isOff: false },
      friday: { start: '10:00', end: '20:00', isOff: false }, saturday: { start: '10:00', end: '20:00', isOff: false },
      sunday: { start: '00:00', end: '00:00', isOff: true }
    },
    leaves: ['2026-08-20']
  },
  {
    _id: 'stf2', name: 'Farhan Chowdhury', photo: 'assets/images/staff-farhan.svg',
    specialty: ['Facial', 'Skin Treatment', 'Anti-Aging Facial'], rating: 4.8, bio: 'Certified skin therapist specializing in facials and rejuvenation treatments.',
    commissionRate: 0.3,
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOff: false }, tuesday: { start: '09:00', end: '18:00', isOff: false },
      wednesday: { start: '09:00', end: '18:00', isOff: false }, thursday: { start: '00:00', end: '00:00', isOff: true },
      friday: { start: '09:00', end: '18:00', isOff: false }, saturday: { start: '09:00', end: '18:00', isOff: false },
      sunday: { start: '09:00', end: '17:00', isOff: false }
    },
    leaves: []
  },
  {
    _id: 'stf3', name: 'Nusrat Jahan', photo: 'assets/images/staff-nusrat.svg',
    specialty: ['Manicure', 'Pedicure', 'Gel Nails'], rating: 4.7, bio: 'Nail artist known for precise, long-lasting gel and acrylic designs.',
    commissionRate: 0.3,
    workingHours: {
      monday: { start: '10:00', end: '19:00', isOff: false }, tuesday: { start: '10:00', end: '19:00', isOff: false },
      wednesday: { start: '10:00', end: '19:00', isOff: false }, thursday: { start: '10:00', end: '19:00', isOff: false },
      friday: { start: '10:00', end: '19:00', isOff: false }, saturday: { start: '00:00', end: '00:00', isOff: true },
      sunday: { start: '10:00', end: '18:00', isOff: false }
    },
    leaves: ['2026-08-15']
  },
  {
    _id: 'stf4', name: 'Tanvir Ahmed', photo: 'assets/images/staff-tanvir.svg',
    specialty: ['Swedish Massage', 'Deep Tissue Massage'], rating: 4.9, bio: 'Licensed massage therapist focused on relaxation and therapeutic techniques.',
    commissionRate: 0.32,
    workingHours: {
      monday: { start: '11:00', end: '20:00', isOff: false }, tuesday: { start: '11:00', end: '20:00', isOff: false },
      wednesday: { start: '11:00', end: '20:00', isOff: false }, thursday: { start: '11:00', end: '20:00', isOff: false },
      friday: { start: '11:00', end: '21:00', isOff: false }, saturday: { start: '11:00', end: '21:00', isOff: false },
      sunday: { start: '00:00', end: '00:00', isOff: true }
    },
    leaves: []
  },
  {
    _id: 'stf5', name: 'Sadia Islam', photo: 'assets/images/staff-sadia.svg',
    specialty: ['Bridal Package', 'Hair Coloring', 'Facial'], rating: 5.0, bio: 'Bridal specialist delivering flawless looks for the most important day.',
    commissionRate: 0.4,
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOff: false }, tuesday: { start: '09:00', end: '18:00', isOff: false },
      wednesday: { start: '00:00', end: '00:00', isOff: true }, thursday: { start: '09:00', end: '18:00', isOff: false },
      friday: { start: '09:00', end: '19:00', isOff: false }, saturday: { start: '09:00', end: '19:00', isOff: false },
      sunday: { start: '09:00', end: '18:00', isOff: false }
    },
    leaves: ['2026-08-25']
  }
];

const MOCK_SERVICES = [
  { _id: 'svc1', name: 'Hair Cut & Style', slug: 'hair-cut-style', category: 'Hair', duration: 45, bufferTime: 15, price: 800, memberPrice: 700, description: 'A precision cut tailored to your face shape, finished with a professional blow-dry style.', shortDescription: 'Precision cut & professional styling', image: 'assets/images/service-haircut.svg', addOns: [{ name: 'Deep Conditioning', price: 300, duration: 15 }, { name: 'Scalp Massage', price: 250, duration: 10 }], availableStaff: ['stf1', 'stf5'], isActive: true, bookingCount: 142 },
  { _id: 'svc2', name: 'Hair Coloring', slug: 'hair-coloring', category: 'Hair', duration: 120, bufferTime: 15, price: 3500, memberPrice: 3100, description: 'Full hair coloring service using premium ammonia-free color, includes consultation and gloss finish.', shortDescription: 'Full color transformation', image: 'assets/images/service-coloring.svg', addOns: [{ name: 'Highlights', price: 1200, duration: 45 }, { name: 'Toner', price: 500, duration: 20 }], availableStaff: ['stf1', 'stf5'], isActive: true, bookingCount: 98 },
  { _id: 'svc3', name: 'Keratin Treatment', slug: 'keratin-treatment', category: 'Hair', duration: 150, bufferTime: 20, price: 6000, memberPrice: 5400, description: 'Smoothing keratin treatment that eliminates frizz and adds long-lasting shine for up to 5 months.', shortDescription: 'Frizz-free smoothing treatment', image: 'assets/images/service-keratin.svg', addOns: [], availableStaff: ['stf1'], isActive: true, bookingCount: 51 },
  { _id: 'svc4', name: 'Facial Cleanup', slug: 'facial-cleanup', category: 'Skin', duration: 40, bufferTime: 10, price: 900, memberPrice: 800, description: 'Deep cleansing facial with steam, extraction, and hydrating mask to refresh your skin.', shortDescription: 'Deep cleanse & refresh', image: 'assets/images/service-facial.svg', addOns: [{ name: 'Gold Mask', price: 400, duration: 15 }], availableStaff: ['stf2'], isActive: true, bookingCount: 121 },
  { _id: 'svc5', name: 'Anti-Aging Facial', slug: 'anti-aging-facial', category: 'Skin', duration: 60, bufferTime: 15, price: 2200, memberPrice: 1950, description: 'Collagen-boosting facial targeting fine lines with LED therapy and peptide serums.', shortDescription: 'Collagen-boosting rejuvenation', image: 'assets/images/service-antiaging.svg', addOns: [{ name: 'LED Therapy', price: 600, duration: 20 }], availableStaff: ['stf2'], isActive: true, bookingCount: 64 },
  { _id: 'svc6', name: 'Classic Manicure', slug: 'classic-manicure', category: 'Nails', duration: 40, bufferTime: 10, price: 700, memberPrice: 600, description: 'Nail shaping, cuticle care, hand massage, and polish of your choice.', shortDescription: 'Shape, buff & polish', image: 'assets/images/service-manicure.svg', addOns: [{ name: 'Paraffin Wax', price: 300, duration: 15 }], availableStaff: ['stf3'], isActive: true, bookingCount: 156 },
  { _id: 'svc7', name: 'Spa Pedicure', slug: 'spa-pedicure', category: 'Nails', duration: 50, bufferTime: 10, price: 900, memberPrice: 800, description: 'Relaxing foot soak, exfoliation, callus removal, massage, and polish.', shortDescription: 'Foot soak, scrub & polish', image: 'assets/images/service-pedicure.svg', addOns: [{ name: 'Paraffin Wax', price: 300, duration: 15 }], availableStaff: ['stf3'], isActive: true, bookingCount: 133 },
  { _id: 'svc8', name: 'Gel Nails', slug: 'gel-nails', category: 'Nails', duration: 60, bufferTime: 15, price: 1400, memberPrice: 1250, description: 'Long-lasting gel polish application with UV curing, chip-free for up to 3 weeks.', shortDescription: 'Chip-free gel color', image: 'assets/images/service-gelnails.svg', addOns: [{ name: 'Nail Art (per hand)', price: 250, duration: 15 }], availableStaff: ['stf3'], isActive: true, bookingCount: 87 },
  { _id: 'svc9', name: 'Swedish Massage', slug: 'swedish-massage', category: 'Massage', duration: 60, bufferTime: 15, price: 1800, memberPrice: 1600, description: 'Gentle full-body massage using long strokes to relax muscles and improve circulation.', shortDescription: 'Full-body relaxation massage', image: 'assets/images/service-swedish.svg', addOns: [{ name: 'Aromatherapy', price: 300, duration: 0 }], availableStaff: ['stf4'], isActive: true, bookingCount: 76 },
  { _id: 'svc10', name: 'Deep Tissue Massage', slug: 'deep-tissue-massage', category: 'Massage', duration: 75, bufferTime: 15, price: 2400, memberPrice: 2100, description: 'Targeted massage using firm pressure to release chronic muscle tension.', shortDescription: 'Firm-pressure therapeutic massage', image: 'assets/images/service-deeptissue.svg', addOns: [{ name: 'Hot Stones', price: 500, duration: 15 }], availableStaff: ['stf4'], isActive: true, bookingCount: 59 },
  { _id: 'svc11', name: 'Bridal Package', slug: 'bridal-package', category: 'Package', duration: 240, bufferTime: 30, price: 15000, memberPrice: 13500, description: 'Complete bridal beauty package: hair styling, makeup, facial, manicure and pedicure.', shortDescription: 'Full bridal beauty day', image: 'assets/images/service-bridal.svg', addOns: [{ name: 'Trial Session', price: 2000, duration: 90 }], availableStaff: ['stf5'], isActive: true, bookingCount: 34 },
  { _id: 'svc12', name: 'Groom Package', slug: 'groom-package', category: 'Package', duration: 150, bufferTime: 20, price: 6500, memberPrice: 5800, description: 'Grooming package with haircut, facial, and shave for the modern groom.', shortDescription: 'Complete groom prep', image: 'assets/images/service-groom.svg', addOns: [], availableStaff: ['stf1', 'stf2'], isActive: true, bookingCount: 28 }
];

const MOCK_PRODUCTS = [
  { _id: 'prd1', name: 'Argan Oil Shampoo', brand: 'Lumière Care', category: 'Hair Care', description: 'Sulfate-free shampoo infused with argan oil for smooth, nourished hair.', images: ['assets/images/product-shampoo1.svg'], rating: 4.6, reviewCount: 34, originalPrice: 950, variants: [{ name: '250ml', price: 750, stock: 40 }, { name: '500ml', price: 1300, stock: 22 }], featured: true, createdAt: '2026-06-01' },
  { _id: 'prd2', name: 'Keratin Repair Conditioner', brand: 'Lumière Care', category: 'Hair Care', description: 'Deep conditioning treatment that repairs damaged, chemically treated hair.', images: ['assets/images/product-conditioner1.svg'], rating: 4.5, reviewCount: 28, originalPrice: null, variants: [{ name: '250ml', price: 850, stock: 35 }], featured: true, createdAt: '2026-05-20' },
  { _id: 'prd3', name: 'Hydrating Face Serum', brand: 'GlowLab', category: 'Skin Care', description: 'Hyaluronic acid serum for deep hydration and a dewy glow.', images: ['assets/images/product-serum1.svg'], rating: 4.8, reviewCount: 51, originalPrice: 1800, variants: [{ name: '30ml', price: 1450, stock: 18 }], featured: true, createdAt: '2026-07-10' },
  { _id: 'prd4', name: 'Vitamin C Brightening Cream', brand: 'GlowLab', category: 'Skin Care', description: 'Daily moisturizer with vitamin C to brighten and even skin tone.', images: ['assets/images/product-cream1.svg'], rating: 4.4, reviewCount: 19, originalPrice: null, variants: [{ name: '50g', price: 1200, stock: 26 }], featured: false, createdAt: '2026-04-15' },
  { _id: 'prd5', name: 'Charcoal Detox Face Wash', brand: 'GlowLab', category: 'Skin Care', description: 'Deep pore-cleansing face wash with activated charcoal.', images: ['assets/images/product-facewash1.svg'], rating: 4.3, reviewCount: 22, originalPrice: 650, variants: [{ name: '150ml', price: 520, stock: 50 }], featured: false, createdAt: '2026-03-11' },
  { _id: 'prd6', name: 'Gel Nail Polish Set', brand: 'ColorPop', category: 'Nail Care', description: 'Set of 6 long-wear gel nail polishes in trending shades.', images: ['assets/images/product-nailset1.svg'], rating: 4.7, reviewCount: 40, originalPrice: 2200, variants: [{ name: 'Set of 6', price: 1800, stock: 15 }], featured: true, createdAt: '2026-07-01' },
  { _id: 'prd7', name: 'Cuticle Oil Pen', brand: 'ColorPop', category: 'Nail Care', description: 'Nourishing cuticle oil in a convenient click pen applicator.', images: ['assets/images/product-cuticleoil1.svg'], rating: 4.2, reviewCount: 12, originalPrice: null, variants: [{ name: '5ml', price: 380, stock: 60 }], featured: false, createdAt: '2026-02-18' },
  { _id: 'prd8', name: 'Professional Hair Dryer', brand: 'SalonPro', category: 'Tools', description: 'Ionic hair dryer with 3 heat settings for salon-quality blowouts at home.', images: ['assets/images/product-dryer1.svg'], rating: 4.9, reviewCount: 63, originalPrice: 5500, variants: [{ name: 'Standard', price: 4500, stock: 10 }], featured: true, createdAt: '2026-06-25' },
  { _id: 'prd9', name: 'Ceramic Flat Iron', brand: 'SalonPro', category: 'Tools', description: 'Ceramic-plated flat iron for smooth, frizz-free styling.', images: ['assets/images/product-flatiron1.svg'], rating: 4.6, reviewCount: 29, originalPrice: null, variants: [{ name: 'Standard', price: 2800, stock: 14 }], featured: false, createdAt: '2026-05-05' },
  { _id: 'prd10', name: 'Rose Water Toner', brand: 'GlowLab', category: 'Skin Care', description: 'Alcohol-free rose water toner to refresh and balance skin.', images: ['assets/images/product-toner1.svg'], rating: 4.5, reviewCount: 17, originalPrice: 550, variants: [{ name: '200ml', price: 420, stock: 45 }], featured: false, createdAt: '2026-01-30' },
  { _id: 'prd11', name: 'Nail Strengthener Base Coat', brand: 'ColorPop', category: 'Nail Care', description: 'Fortifying base coat that strengthens brittle nails.', images: ['assets/images/product-basecoat1.svg'], rating: 4.3, reviewCount: 9, originalPrice: null, variants: [{ name: '12ml', price: 480, stock: 33 }], featured: false, createdAt: '2026-03-22' },
  { _id: 'prd12', name: 'Bamboo Hair Brush', brand: 'Lumière Care', category: 'Tools', description: 'Eco-friendly bamboo brush that reduces static and breakage.', images: ['assets/images/product-brush1.svg'], rating: 4.7, reviewCount: 25, originalPrice: 700, variants: [{ name: 'Standard', price: 550, stock: 38 }], featured: false, createdAt: '2026-04-02' },
  { _id: 'prd13', name: 'Anti-Dandruff Shampoo', brand: 'Lumière Care', category: 'Hair Care', description: 'Medicated shampoo that controls dandruff and soothes the scalp.', images: ['assets/images/product-shampoo2.svg'], rating: 4.4, reviewCount: 31, originalPrice: null, variants: [{ name: '250ml', price: 680, stock: 42 }], featured: false, createdAt: '2026-02-10' },
  { _id: 'prd14', name: 'Under-Eye Gel Patches', brand: 'GlowLab', category: 'Skin Care', description: 'Cooling collagen gel patches to reduce puffiness and dark circles.', images: ['assets/images/product-eyepatch1.svg'], rating: 4.6, reviewCount: 44, originalPrice: 900, variants: [{ name: 'Pack of 5', price: 690, stock: 28 }], featured: true, createdAt: '2026-07-18' },
  { _id: 'prd15', name: 'Nail File & Buffer Kit', brand: 'ColorPop', category: 'Nail Care', description: 'Complete 4-way nail file and buffer set for salon-finish nails.', images: ['assets/images/product-nailkit1.svg'], rating: 4.1, reviewCount: 14, originalPrice: null, variants: [{ name: 'Kit', price: 320, stock: 55 }], featured: false, createdAt: '2026-01-12' }
];

const MOCK_REVIEWS = [
  { _id: 'rev1', type: 'service', referenceId: 'svc1', customerName: 'Farzana K.', rating: 5, comment: 'Best haircut I have had in years. Aisha really listens to what you want!', date: '2026-07-15' },
  { _id: 'rev2', type: 'service', referenceId: 'svc9', customerName: 'Rakib H.', rating: 5, comment: 'Incredibly relaxing massage, Tanvir is a true professional.', date: '2026-07-02' },
  { _id: 'rev3', type: 'product', referenceId: 'prd3', customerName: 'Meherun N.', rating: 5, comment: 'This serum changed my skin completely within two weeks.', date: '2026-06-28' },
  { _id: 'rev4', type: 'staff', referenceId: 'stf5', customerName: 'Tanjina S.', rating: 5, comment: 'Sadia did my bridal look and I have never felt more beautiful.', date: '2026-06-10' },
  { _id: 'rev5', type: 'service', referenceId: 'svc6', customerName: 'Nabila R.', rating: 4, comment: 'Lovely manicure, polish lasted almost 2 weeks.', date: '2026-05-30' },
  { _id: 'rev6', type: 'product', referenceId: 'prd8', customerName: 'Imran A.', rating: 5, comment: 'Salon-quality results at home, worth every taka.', date: '2026-05-14' },
  { _id: 'rev7', type: 'service', referenceId: 'svc4', customerName: 'Sabrina Y.', rating: 4, comment: 'My skin felt so fresh after the facial cleanup, will return.', date: '2026-04-22' },
  { _id: 'rev8', type: 'staff', referenceId: 'stf1', customerName: 'Proma D.', rating: 5, comment: 'Aisha is a color genius, exactly the balayage I wanted.', date: '2026-04-05' }
];

const MOCK_COUPONS = [
  { code: 'FIRST10', type: 'percent', value: 10, minSpend: 0, description: '10% off your first order', isActive: true },
  { code: 'WELCOME500', type: 'fixed', value: 500, minSpend: 3000, description: '৳500 off orders above ৳3000', isActive: true },
  { code: 'SAVE15', type: 'percent', value: 15, minSpend: 2000, description: '15% off orders above ৳2000', isActive: true }
];
