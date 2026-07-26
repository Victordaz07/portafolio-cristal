-- AlterTable: Hero
ALTER TABLE "Hero"
  ADD COLUMN "nicheEn" TEXT,
  ADD COLUMN "badgeLabelEn" TEXT,
  ADD COLUMN "headlinePlainEn" TEXT,
  ADD COLUMN "headlineEmphasisEn" TEXT,
  ADD COLUMN "headlineSuffixEn" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "ctaPrimaryLabelEn" TEXT,
  ADD COLUMN "ctaSecondaryLabelEn" TEXT;

-- AlterTable: Stat
ALTER TABLE "Stat" ADD COLUMN "labelEn" TEXT;

-- AlterTable: ContentCard
ALTER TABLE "ContentCard"
  ADD COLUMN "captionEn" TEXT,
  ADD COLUMN "categoryEn" TEXT,
  ADD COLUMN "statPrimaryEn" TEXT,
  ADD COLUMN "statSecondaryEn" TEXT;

-- AlterTable: Review
ALTER TABLE "Review"
  ADD COLUMN "categoryEn" TEXT,
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "descriptionEn" TEXT;

-- AlterTable: Service
ALTER TABLE "Service"
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "descriptionEn" TEXT;

-- AlterTable: Testimonial
ALTER TABLE "Testimonial"
  ADD COLUMN "quoteEn" TEXT,
  ADD COLUMN "roleEn" TEXT;

-- AlterTable: Package
ALTER TABLE "Package"
  ADD COLUMN "nameEn" TEXT,
  ADD COLUMN "itemsEn" TEXT[];

-- AlterTable: FaqItem
ALTER TABLE "FaqItem"
  ADD COLUMN "questionEn" TEXT,
  ADD COLUMN "answerEn" TEXT;

-- AlterTable: SiteSettings
ALTER TABLE "SiteSettings"
  ADD COLUMN "whyMeTextEn" TEXT,
  ADD COLUMN "footerIntroEn" TEXT,
  ADD COLUMN "supportMessageEn" TEXT;

-- Populate English translations for existing content

-- Hero (singleton, one row)
UPDATE "Hero" SET
  "nicheEn" = 'UGC Creator',
  "badgeLabelEn" = 'UGC Creator • Brand Reviews',
  "headlinePlainEn" = 'Reviews that',
  "headlineEmphasisEn" = 'inspire',
  "headlineSuffixEn" = 'trust.',
  "descriptionEn" = 'I create authentic UGC content and honest reviews that connect brands with real people.',
  "ctaPrimaryLabelEn" = 'View portfolio',
  "ctaSecondaryLabelEn" = 'Let''s work together';

-- Stat
UPDATE "Stat" SET "labelEn" = 'Audience' WHERE "order" = 0;
UPDATE "Stat" SET "labelEn" = 'Collaborations' WHERE "order" = 1;
UPDATE "Stat" SET "labelEn" = 'Rating' WHERE "order" = 2;

-- ContentCard: fix category to Spanish where it was left in English, plus En translations
UPDATE "ContentCard" SET category = 'Maquillaje y cuidado de la piel', "categoryEn" = 'Makeup & Skincare' WHERE category = 'Makeup & Skincare';
UPDATE "ContentCard" SET category = 'Cabello', "categoryEn" = 'Hair' WHERE category = 'Hair';
UPDATE "ContentCard" SET category = 'Libros', "categoryEn" = 'Books' WHERE category = 'Books';
UPDATE "ContentCard" SET category = 'Estilo de vida', "categoryEn" = 'Lifestyle' WHERE category = 'Lifestyle';

UPDATE "ContentCard" SET "captionEn" = 'My morning skincare routine', "statPrimaryEn" = '120K views', "statSecondaryEn" = '9.4% ER' WHERE "order" = 0;
UPDATE "ContentCard" SET "captionEn" = 'Trying the serum everyone''s asking about', "statPrimaryEn" = '88K views', "statSecondaryEn" = '7.1% ER' WHERE "order" = 1;
UPDATE "ContentCard" SET "captionEn" = 'Hair transformation with Dear Hair', "statPrimaryEn" = '64K views', "statSecondaryEn" = '6.8% ER' WHERE "order" = 2;
UPDATE "ContentCard" SET "captionEn" = 'Get-ready-with-me with Charlotte Tilbury products', "statPrimaryEn" = '3.2K likes', "statSecondaryEn" = '410 saves' WHERE "order" = 3;
UPDATE "ContentCard" SET "captionEn" = 'My latest read — spoiler-free review', "statPrimaryEn" = '2.1K likes', "statSecondaryEn" = '560 saves' WHERE "order" = 4;
UPDATE "ContentCard" SET "captionEn" = 'A quiet Sunday with tea and books', "statPrimaryEn" = '51K views', "statSecondaryEn" = '8.9% ER' WHERE "order" = 5;

UPDATE "ContentCard" SET "statPrimary" = '120K vistas' WHERE "order" = 0;
UPDATE "ContentCard" SET "statPrimary" = '88K vistas' WHERE "order" = 1;
UPDATE "ContentCard" SET "statPrimary" = '64K vistas' WHERE "order" = 2;
UPDATE "ContentCard" SET "statPrimary" = '3.2K me gusta' WHERE "order" = 3;
UPDATE "ContentCard" SET "statPrimary" = '2.1K me gusta' WHERE "order" = 4;
UPDATE "ContentCard" SET "statPrimary" = '51K vistas' WHERE "order" = 5;
UPDATE "ContentCard" SET "statSecondary" = '410 guardados' WHERE "order" = 3;
UPDATE "ContentCard" SET "statSecondary" = '560 guardados' WHERE "order" = 4;

-- Review
UPDATE "Review" SET "categoryEn" = 'Skincare', "titleEn" = 'IUNIK – Tea Tree Serum', "descriptionEn" = 'Calms, hydrates, and visibly improves sensitive skin.' WHERE "order" = 0;
UPDATE "Review" SET "categoryEn" = 'Beauty', "titleEn" = 'Cushionaire', "descriptionEn" = 'Lightweight coverage with a natural finish, perfect for everyday wear.' WHERE "order" = 1;
UPDATE "Review" SET "categoryEn" = 'Lifestyle', "titleEn" = 'Mary & May – Wash Off Mask', "descriptionEn" = 'Soft texture that leaves skin feeling fresh without drying it out.' WHERE "order" = 2;

-- Service
UPDATE "Service" SET "titleEn" = 'UGC Content', "descriptionEn" = 'Authentic videos and photos created to connect with your audience.' WHERE "order" = 0;
UPDATE "Service" SET "titleEn" = 'Honest Reviews', "descriptionEn" = 'Real opinions that build trust and boost conversions.' WHERE "order" = 1;
UPDATE "Service" SET "titleEn" = 'Unboxings', "descriptionEn" = 'Unboxing experiences and first impressions people fall in love with.' WHERE "order" = 2;
UPDATE "Service" SET "titleEn" = 'Product Photography', "descriptionEn" = 'Clean, aesthetic images aligned with your brand identity.' WHERE "order" = 3;
UPDATE "Service" SET "titleEn" = 'Social Content', "descriptionEn" = 'Reels, TikToks, and Shorts optimized for every platform.' WHERE "order" = 4;

-- Testimonial
UPDATE "Testimonial" SET
  "quoteEn" = 'Crislia perfectly understands our brand and creates content that truly connects with our audience. A pleasure to work with her!',
  "roleEn" = 'Marketing Manager – IUNIK'
WHERE "order" = 0;
UPDATE "Testimonial" SET
  "quoteEn" = 'Her reviews are honest, detailed, and visually beautiful. We''ve seen excellent engagement and conversions.',
  "roleEn" = 'Founder – Mary & May'
WHERE "order" = 1;
UPDATE "Testimonial" SET
  "quoteEn" = 'Professional, creative, and always delivers on time. We recommend her 100%.',
  "roleEn" = 'Brand Manager – Dr. Different'
WHERE "order" = 2;

-- Package
UPDATE "Package" SET
  "nameEn" = 'Starter Package',
  "itemsEn" = ARRAY[
    '2-3 UGC videos',
    'Product demonstration',
    'Voiceover or talking to camera',
    'Natural lighting',
    'Vertical format (9:16)',
    'Organic style editing'
  ]
WHERE "order" = 0;
UPDATE "Package" SET
  "nameEn" = 'Growth Package',
  "itemsEn" = ARRAY[
    '5-7 UGC videos',
    'Different hooks',
    'Multiple CTAs',
    'Lifestyle + product shots',
    'B-Roll footage',
    'Caption suggestions'
  ]
WHERE "order" = 1;
UPDATE "Package" SET
  "nameEn" = 'Premium Brand Package',
  "itemsEn" = ARRAY[
    '10+ UGC videos',
    'Multiple concepts',
    'Different hooks & angles',
    'Product photography',
    'Raw footage available',
    'Ad-style creatives',
    'Organic & paid media versions',
    'Scriptwriting included',
    'Thumbnail suggestions'
  ]
WHERE "order" = 2;

-- FaqItem
UPDATE "FaqItem" SET
  "questionEn" = 'What''s the turnaround time?',
  "answerEn" = 'Standard turnaround is 5 to 7 business days from when I receive the brief and product. For urgent collaborations, we can coordinate an express delivery.'
WHERE "order" = 0;
UPDATE "FaqItem" SET
  "questionEn" = 'What usage rights are included in each package?',
  "answerEn" = 'All packages include organic usage on my channels and your brand''s. Paid usage (whitelisting/paid ads) is quoted separately and always detailed in writing before filming.'
WHERE "order" = 1;
UPDATE "FaqItem" SET
  "questionEn" = 'Do you offer custom packages?',
  "answerEn" = 'Yes. If your brand needs a different number of deliverables, formats, or turnaround than the published packages, message me and we''ll put together a custom proposal.'
WHERE "order" = 2;

-- SiteSettings (singleton, one row)
UPDATE "SiteSettings" SET
  "whyMeTextEn" = 'I work with beauty, skincare, hair, books, and lifestyle brands creating authentic content: no forced scripts, no sales pitches. I care about every detail of filming and editing as if it were for my own account, and I keep clear, responsible communication at every stage of the collaboration, from the brief to final delivery.',
  "footerIntroEn" = 'Thanks for being part of this space. I love sharing what I use, what works for me, and what can make your life easier and more beautiful.',
  "supportMessageEn" = 'Every like, comment, and share helps me keep creating content that''s useful to you. Thank you, from the heart!';
