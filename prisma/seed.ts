import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Créer les catégories
  console.log('📁 Creating categories...')

  const tech = await prisma.category.upsert({
    where: { slug: 'tech' },
    update: {},
    create: {
      name: 'Tech',
      slug: 'tech',
      description: 'Chaînes tech, développement et informatique',
    },
  })

  const gaming = await prisma.category.upsert({
    where: { slug: 'gaming' },
    update: {},
    create: {
      name: 'Gaming',
      slug: 'gaming',
      description: 'Chaînes de jeux vidéo et gaming',
    },
  })

  const lifestyle = await prisma.category.upsert({
    where: { slug: 'lifestyle' },
    update: {},
    create: {
      name: 'Lifestyle',
      slug: 'lifestyle',
      description: 'Lifestyle, beauté et bien-être',
    },
  })

  const finance = await prisma.category.upsert({
    where: { slug: 'finance' },
    update: {},
    create: {
      name: 'Finance',
      slug: 'finance',
      description: 'Finance personnelle et investissement',
    },
  })

  const education = await prisma.category.upsert({
    where: { slug: 'education' },
    update: {},
    create: {
      name: 'Éducation',
      slug: 'education',
      description: 'Éducation, sciences et vulgarisation',
    },
  })

  console.log('✅ Categories created:', {
    tech: tech.id,
    gaming: gaming.id,
    lifestyle: lifestyle.id,
    finance: finance.id,
    education: education.id,
  })

  // Note: On ne crée pas de chaînes ici car cela nécessite l'API YouTube
  // Les chaînes seront ajoutées manuellement via l'API

  console.log('')
  console.log('✅ Seed completed!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Get YouTube API key from https://console.cloud.google.com/')
  console.log('2. Add channels via POST /api/channels')
  console.log('3. Scrape channels to detect promo codes')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
