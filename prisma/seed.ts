import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { slugifyName } from "../src/lib/person-utils";

const peopleData = [
  {
    name: "Julianne Moore",
    primaryRole: "actor",
    bio: "Academy Award-winning actress known for emotionally complex performances.",
    longBio:
      "Julianne Moore has built a career on fearless, nuanced portrayals across independent cinema and major studio films. Known for Still Alice, Far from Heaven, and Boogie Nights, she brings depth to every short-form story she touches. At Shorty, she champions intimate character work in under-twenty-minute formats.",
    imgUrl: "https://i.pravatar.cc/300?u=jmoore",
    birthplace: "Fayetteville, North Carolina",
    bornYear: 1960,
  },
  {
    name: "Oscar Isaac",
    primaryRole: "actor",
    bio: "Versatile star of Star Wars, Dune, and acclaimed indie dramas.",
    longBio:
      "Oscar Isaac's range spans blockbusters and festival darlings alike. A Juilliard-trained performer, he gravitates toward morally complex roles and has become a favorite collaborator for emerging short-film directors seeking cinematic intensity in miniature.",
    imgUrl: "https://i.pravatar.cc/300?u=oisac",
    birthplace: "Guatemala City, Guatemala",
    bornYear: 1979,
  },
  {
    name: "Florence Pugh",
    primaryRole: "actor",
    bio: "International recognition for Lady Macbeth and Black Widow.",
    longBio:
      "Florence Pugh burst onto the scene with raw, magnetic performances that translate powerfully to the short format. Her work emphasizes physicality and subtext — qualities that make every frame count when runtime is limited.",
    imgUrl: "https://i.pravatar.cc/300?u=fpugh",
    birthplace: "Oxford, England",
    bornYear: 1996,
  },
  {
    name: "Dev Patel",
    primaryRole: "actor",
    bio: "Breakout star of Slumdog Millionaire and The Green Knight.",
    longBio:
      "Dev Patel continues to seek out bold storytelling across genres. His collaborations on Shorty productions often explore identity, migration, and belonging — themes that resonate deeply in condensed narrative forms.",
    imgUrl: "https://i.pravatar.cc/300?u=dpatel",
    birthplace: "London, England",
    bornYear: 1990,
  },
  {
    name: "Anya Taylor-Joy",
    primaryRole: "actor",
    bio: "Known for The Queen's Gambit and The Witch.",
    longBio:
      "Anya Taylor-Joy's striking presence and precision have made her one of the most sought-after performers in contemporary short film. She often selects projects that blend genre conventions with art-house sensibilities.",
    imgUrl: "https://i.pravatar.cc/300?u=ataylor",
    birthplace: "Miami, Florida",
    bornYear: 1996,
  },
  {
    name: "Chloé Zhao",
    primaryRole: "director",
    bio: "Oscar-winning director of Nomadland, master of naturalistic cinema.",
    longBio:
      "Chloé Zhao brings documentary instincts to narrative filmmaking. Her short-form work on Shorty emphasizes real locations, non-professional energy, and patient observation — crafting entire worlds in minutes rather than hours.",
    imgUrl: "https://i.pravatar.cc/300?u=czhao",
    birthplace: "Beijing, China",
    bornYear: 1982,
  },
  {
    name: "Jordan Peele",
    primaryRole: "director",
    bio: "Genre-bending filmmaker behind Get Out and Us.",
    longBio:
      "Jordan Peele's short films on Shorty explore social horror and dark comedy with surgical timing. He mentors emerging writers and believes the short format is the best laboratory for bold cinematic ideas.",
    imgUrl: "https://i.pravatar.cc/300?u=jpeele",
    birthplace: "New York City, New York",
    bornYear: 1979,
  },
  {
    name: "Phoebe Waller-Bridge",
    primaryRole: "writer",
    bio: "Creator of Fleabag, celebrated for sharp dialogue and dark wit.",
    longBio:
      "Phoebe Waller-Bridge's writing crackles with honesty and humor. Her Shorty scripts compress entire character arcs into single scenes, proving that brevity can amplify emotional impact rather than diminish it.",
    imgUrl: "https://i.pravatar.cc/300?u=pwbridge",
    birthplace: "London, England",
    bornYear: 1985,
  },
  {
    name: "Roger Deakins",
    primaryRole: "cinematographer",
    bio: "Legendary DP of Blade Runner 2049 and No Country for Old Men.",
    longBio:
      "Roger Deakins approaches short films with the same meticulous eye he brings to features. Light, composition, and movement tell the story when dialogue falls away — a philosophy perfectly suited to Shorty's visual storytellers.",
    imgUrl: "https://i.pravatar.cc/300?u=rdeakins",
    birthplace: "Torquay, England",
    bornYear: 1949,
  },
  {
    name: "Hildur Guðnadóttir",
    primaryRole: "composer",
    bio: "Oscar-winning composer of Joker and Chernobyl.",
    longBio:
      "Hildur Guðnadóttir creates scores that breathe with the image. Her Shorty collaborations use sound design and minimal melody to build atmosphere fast — essential when a film has only fifteen minutes to leave a mark.",
    imgUrl: "https://i.pravatar.cc/300?u=hildur",
    birthplace: "Reykjavik, Iceland",
    bornYear: 1982,
  },
  {
    name: "Ari Wegner",
    primaryRole: "cinematographer",
    bio: "Power of the Dog DP, known for painterly natural light.",
    longBio:
      "Ari Wegner brings a painter's sensibility to every frame. On Shorty productions she experiments with aspect ratio and color temperature to signal genre shifts within tight runtimes.",
    imgUrl: "https://i.pravatar.cc/300?u=awegner",
    birthplace: "Brisbane, Australia",
    bornYear: 1987,
  },
  {
    name: "Barry Jenkins",
    primaryRole: "director",
    bio: "Moonlight director, poet of human connection on screen.",
    longBio:
      "Barry Jenkins treats short film as poetry in motion. His Shorty work focuses on quiet moments between people — glances, pauses, and gestures that speak volumes when time is scarce.",
    imgUrl: "https://i.pravatar.cc/300?u=bjenkins",
    birthplace: "Miami, Florida",
    bornYear: 1979,
  },
];

const filmData = [
  {
    title: "Midnight Echo",
    category: "drama",
    rating: 9.2,
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
    description:
      "A haunting portrait of a musician who hears the past in every note. An exclusive Shorty production.",
    featured: true,
    year: 2025,
    duration: 18,
  },
  {
    title: "Neon Drift",
    category: "sci-fi",
    rating: 8.7,
    posterUrl: "https://images.unsplash.com/photo-1536440136627-6921e69e7939?w=400&h=600&fit=crop",
    description:
      "In a rain-soaked megacity, a courier discovers a package that rewrites reality itself.",
    year: 2024,
    duration: 22,
  },
  {
    title: "The Last Laugh",
    category: "comedy",
    rating: 8.1,
    posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=400&h=600&fit=crop",
    description:
      "A stand-up comic's worst night becomes the set of a lifetime. Hilarious and heartfelt.",
    year: 2024,
    duration: 14,
  },
  {
    title: "Paper Wings",
    category: "animation",
    rating: 9.0,
    posterUrl: "https://images.unsplash.com/photo-1574267432550-4b462ee09266?w=400&h=600&fit=crop",
    description:
      "A child builds a fleet of paper planes that carry messages across a divided city.",
    year: 2025,
    duration: 12,
  },
  {
    title: "Signal Lost",
    category: "sci-fi",
    rating: 8.5,
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    description:
      "An astronaut receives transmissions from a mission that was never launched.",
    year: 2023,
    duration: 20,
  },
  {
    title: "Borrowed Time",
    category: "drama",
    rating: 8.9,
    posterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&h=600&fit=crop",
    description:
      "Two strangers share one hour on a bench and trade the stories they never told anyone.",
    year: 2024,
    duration: 16,
  },
  {
    title: "Side Quest",
    category: "comedy",
    rating: 7.8,
    posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    description:
      "A gamer accidentally livestreams his real-life quest to return a neighbor's cat.",
    year: 2023,
    duration: 11,
  },
  {
    title: "Static Bloom",
    category: "animation",
    rating: 8.4,
    posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop",
    description:
      "Plants grow through old television sets in an abandoned suburb, pixel by pixel.",
    year: 2025,
    duration: 9,
  },
  {
    title: "Cold Frame",
    category: "drama",
    rating: 8.6,
    posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=400&h=600&fit=crop",
    description:
      "A photographer develops a roll of film that captures moments from a life she never lived.",
    year: 2024,
    duration: 17,
  },
  {
    title: "Orbit Café",
    category: "sci-fi",
    rating: 8.3,
    posterUrl: "https://images.unsplash.com/photo-1419242902214-272b3b66d7?w=400&h=600&fit=crop",
    description:
      "The last coffee shop on a space station serves one final customer before decommission.",
    year: 2023,
    duration: 13,
  },
  {
    title: "Double Feature",
    category: "comedy",
    rating: 7.6,
    posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    description:
      "Twin projectionists accidentally swap reels and create the greatest mashup ever.",
    year: 2024,
    duration: 10,
  },
  {
    title: "Glass River",
    category: "drama",
    rating: 9.1,
    posterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&h=600&fit=crop",
    description:
      "A ferry captain navigates a river that reflects memories instead of the sky.",
    year: 2025,
    duration: 19,
  },
];

const characterNames = [
  "Mara", "Elliot", "Sasha", "Theo", "Lena", "Jonah", "Iris", "Felix",
];

async function main() {
  await prisma.viewEvent.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.filmCredit.deleteMany();
  await prisma.person.deleteMany();
  await prisma.film.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hash(pw, 12);
  const adminPassword = await hash("admin123");
  const userPassword = await hash("demo1234");

  const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const demoUsers = [
    {
      username: "admin",
      email: "admin@shorty.app",
      password: adminPassword,
      role: "admin",
      photoUrl: "https://ui-avatars.com/api/?name=Admin&background=ff7a18&color=fff",
    },
    {
      username: "demo",
      email: "demo@shorty.app",
      password: userPassword,
      role: "user",
      subscriptionTier: "standard",
      subscriptionStatus: "active",
      subscriptionEndsAt: inDays(365),
    },
    {
      username: "trialuser",
      email: "trial@shorty.app",
      password: userPassword,
      role: "user",
      trialEndsAt: inDays(7),
    },
    {
      username: "basicuser",
      email: "basic@shorty.app",
      password: userPassword,
      role: "user",
      subscriptionTier: "basic",
      subscriptionStatus: "active",
      subscriptionEndsAt: inDays(30),
    },
    {
      username: "premiumuser",
      email: "premium@shorty.app",
      password: userPassword,
      role: "user",
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      subscriptionEndsAt: inDays(30),
    },
    {
      username: "expireduser",
      email: "expired@shorty.app",
      password: userPassword,
      role: "user",
      trialEndsAt: daysAgo(1),
      subscriptionTier: "none",
    },
    {
      username: "guestplus",
      email: "guestplus@shorty.app",
      password: userPassword,
      role: "user",
      subscriptionTier: "standard",
      subscriptionStatus: "canceled",
      subscriptionEndsAt: inDays(14),
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.create({ data: u });
  }

  const people = await Promise.all(
    peopleData.map((p) =>
      prisma.person.create({
        data: { ...p, slug: slugifyName(p.name) },
      })
    )
  );

  const byRole = (role: string) => people.filter((p) => p.primaryRole === role);
  const actors = byRole("actor");
  const directors = byRole("director");
  const writers = byRole("writer");
  const cinematographers = byRole("cinematographer");
  const composers = byRole("composer");

  const videoUrl = "https://www.youtube.com/embed/KVZ-P-ZI6W4";
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  for (let i = 0; i < filmData.length; i++) {
    const film = filmData[i];
    const filmRecord = await prisma.film.create({
      data: {
        ...film,
        videoUrl,
        monthlyFreeMonth: film.featured ? monthKey : undefined,
      },
    });

    const shuffledActors = [...actors].sort(() => Math.random() - 0.5).slice(0, 2);
    const director = directors[i % directors.length];
    const writer = writers[i % writers.length];
    const dp = cinematographers[i % cinematographers.length];
    const composer = composers[i % composers.length];

    const credits = [
      ...shuffledActors.map((actor, j) => ({
        personId: actor.id,
        filmId: filmRecord.id,
        role: "actor",
        characterName: characterNames[(i + j) % characterNames.length],
      })),
      { personId: director.id, filmId: filmRecord.id, role: "director" },
      { personId: writer.id, filmId: filmRecord.id, role: "writer" },
      { personId: dp.id, filmId: filmRecord.id, role: "cinematographer" },
      { personId: composer.id, filmId: filmRecord.id, role: "composer" },
    ];

    await prisma.filmCredit.createMany({ data: credits });
  }

  console.log("Database seeded successfully!");
  console.log(`People: ${people.length} | Monthly free month: ${monthKey}`);
  console.log("\n--- Demo accounts (password for all users: demo1234) ---");
  console.log("admin / admin123          → Admin panel access");
  console.log("demo / demo1234           → Standard subscriber (full access)");
  console.log("trialuser / demo1234      → Active 7-day free trial");
  console.log("basicuser / demo1234      → Basic plan ($1.99/mo)");
  console.log("premiumuser / demo1234    → Premium plan ($5.99/mo)");
  console.log("expireduser / demo1234    → Expired trial, no subscription");
  console.log("guestplus / demo1234      → Canceled sub, access until period ends");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
