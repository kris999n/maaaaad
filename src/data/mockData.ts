export interface Deal {
  id: string;
  item: string;
  price: number;
  normalPrice: number;
  saving: number;
  store: string;
  category: string;
  unit: string;
  imageUrl?: string;
  isMemberDeal?: boolean;
  memberType?: string;
}

export interface RecipeIngredient {
  name: string;       // Exact ingredient name used for matching
  displayName: string;// User-facing display name, e.g. "Økologisk letmælk"
  amount: string;      // Quantity needed, e.g. "1 liter" or "400g"
  isBasis?: boolean;   // If true, it's a pantry staple (salt, pepper, garlic, etc.) that the user likely has
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  prepTime: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  healthScore?: number;
  holdbarhed?: string;
  kanFryses?: string;
  tips?: {
    healthier: string;
    cheaper: string;
  };
}

export const SUPERMARKETS = [
  { name: 'Meny', color: '#DE0F17', bgColor: '#FFECEF' },
  { name: 'Rema 1000', color: '#0059B3', bgColor: '#E6F0FA' },
  { name: 'Netto', color: '#FFE000', textColor: '#000000', bgColor: '#FFFEE6' },
  { name: 'Lidl', color: '#002F6C', bgColor: '#E6ECF5' },
  { name: 'Coop 365', color: '#00A859', bgColor: '#E6F6EE' },
  { name: 'Føtex', color: '#003A70', bgColor: '#E6ECF2' }
];

export const CATEGORIES = [
  'Alle',
  'Kød & Fisk',
  'Mejeri & Æg',
  'Grøntsager & Frugt',
  'Kolonial & Konserves',
  'Brød & Kager'
];

// Initial Deals active in the app
export const INITIAL_DEALS: Deal[] = [
  // Meny
  {
    id: 'm1',
    item: 'Hel oksemørbrad',
    price: 125,
    normalPrice: 185,
    saving: 60,
    store: 'Meny',
    category: 'Kød & Fisk',
    unit: '800g',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'm2',
    item: 'Riberhus skæreost 45+',
    price: 26,
    normalPrice: 39,
    saving: 13,
    store: 'Meny',
    category: 'Mejeri & Æg',
    unit: '400g',
    imageUrl: 'https://images.unsplash.com/photo-1486887396153-fa416526c132?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'm3',
    item: 'Økologisk jomfru olivenolie',
    price: 49,
    normalPrice: 69,
    saving: 20,
    store: 'Meny',
    category: 'Kolonial & Konserves',
    unit: '500ml',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=60'
  },

  // Rema 1000
  {
    id: 'r1',
    item: 'Hakket oksekød 8-12%',
    price: 34,
    normalPrice: 49,
    saving: 15,
    store: 'Rema 1000',
    category: 'Kød & Fisk',
    unit: '400g',
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'r2',
    item: 'Danske gulerødder',
    price: 6,
    normalPrice: 11,
    saving: 5,
    store: 'Rema 1000',
    category: 'Grøntsager & Frugt',
    unit: '1 kg',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'r3',
    item: 'Lurpak Smørbar',
    price: 13,
    normalPrice: 22,
    saving: 9,
    store: 'Rema 1000',
    category: 'Mejeri & Æg',
    unit: '250g',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=60'
  },

  // Netto
  {
    id: 'n1',
    item: 'Kyllingebrystfilet',
    price: 28,
    normalPrice: 42,
    saving: 14,
    store: 'Netto',
    category: 'Kød & Fisk',
    unit: '450g',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'n2',
    item: 'Dåse hakkede tomater',
    price: 4,
    normalPrice: 8,
    saving: 4,
    store: 'Netto',
    category: 'Kolonial & Konserves',
    unit: '400g',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'n3',
    item: 'Økologiske bananer',
    price: 10,
    normalPrice: 15,
    saving: 5,
    store: 'Netto',
    category: 'Grøntsager & Frugt',
    unit: '5 stk',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=60'
  },

  // Lidl
  {
    id: 'l1',
    item: 'Frisk laksesteak',
    price: 39,
    normalPrice: 55,
    saving: 16,
    store: 'Lidl',
    category: 'Kød & Fisk',
    unit: '250g',
    imageUrl: 'https://images.unsplash.com/photo-1485921325814-a5341f6118d8?w=300&auto=format&fit=crop&q=60',
    isMemberDeal: true,
    memberType: 'Lidl Plus'
  },
  {
    id: 'l2',
    item: 'Økologiske citroner',
    price: 8,
    normalPrice: 14,
    saving: 6,
    store: 'Lidl',
    category: 'Grøntsager & Frugt',
    unit: '4 stk',
    imageUrl: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'l3',
    item: 'Spaghetti n. 5',
    price: 5,
    normalPrice: 9,
    saving: 4,
    store: 'Lidl',
    category: 'Kolonial & Konserves',
    unit: '500g',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=60'
  },

  // Coop 365
  {
    id: 'c1',
    item: 'Økologisk letmælk',
    price: 8,
    normalPrice: 12,
    saving: 4,
    store: 'Coop 365',
    category: 'Mejeri & Æg',
    unit: '1 liter',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=60',
    isMemberDeal: true,
    memberType: 'Coop Medlem'
  },
  {
    id: 'c2',
    item: 'Tørrede røde linser',
    price: 9,
    normalPrice: 15,
    saving: 6,
    store: 'Coop 365',
    category: 'Kolonial & Konserves',
    unit: '400g',
    imageUrl: 'https://images.unsplash.com/photo-1545177627-142277d3493e?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'c3',
    item: 'Avocado',
    price: 12,
    normalPrice: 18,
    saving: 6,
    store: 'Coop 365',
    category: 'Grøntsager & Frugt',
    unit: '2 stk',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&auto=format&fit=crop&q=60'
  },

  // Føtex
  {
    id: 'f1',
    item: 'Hakket svine- & kalvekød 8-12%',
    price: 29,
    normalPrice: 39,
    saving: 10,
    store: 'Føtex',
    category: 'Kød & Fisk',
    unit: '500g',
    imageUrl: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'f2',
    item: 'Madlavningsfløde 18%',
    price: 10,
    normalPrice: 16,
    saving: 6,
    store: 'Føtex',
    category: 'Mejeri & Æg',
    unit: '250ml',
    imageUrl: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'f3',
    item: 'Friske porrer',
    price: 6,
    normalPrice: 11,
    saving: 5,
    store: 'Føtex',
    category: 'Grøntsager & Frugt',
    unit: '3 stk',
    imageUrl: 'https://images.unsplash.com/photo-1587570255959-cb1477bd2cb8?w=300&auto=format&fit=crop&q=60'
  }
];

// Initial Recipes database
export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec1',
    name: 'Klassisk Lasagne',
    description: 'En sand hverdagsfavorit med en rig kødsovs og cremet ostetæppe.',
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&auto=format&fit=crop&q=80',
    prepTime: 45,
    servings: 4,
    tags: ['Familievenlig', 'Populær', 'Pasta'],
    healthScore: 5,
    tips: {
      healthier: 'Riv 2 gulerødder og 1 porre fint og svits dem med i kødsovsen. Det booster fiberindholdet og tæller som +2 på sundhedsskalaen!',
      cheaper: 'Erstat halvdelen eller hele mængden af hakket oksekød med tørrede røde linser. Det sparer dig for ca. 25 kr. og smager fantastisk.'
    },
    ingredients: [
      { name: 'Hakket oksekød', displayName: 'Hakket oksekød 8-12%', amount: '400g' },
      { name: 'Dåse hakkede tomater', displayName: 'Hakkede tomater', amount: '1 dåse (400g)' },
      { name: 'Letmælk', displayName: 'Økologisk letmælk', amount: '5 dl' },
      { name: 'Ost', displayName: 'Riberhus skæreost (revet)', amount: '150g' },
      { name: 'Lasagneplader', displayName: 'Lasagneplader', amount: '12 plader' },
      { name: 'Løg', displayName: 'Løg', amount: '1 stk', isBasis: true },
      { name: 'Hvidløg', displayName: 'Hvidløgsfed', amount: '2 stk', isBasis: true },
      { name: 'Salt & Peber', displayName: 'Salt og peber', amount: 'Knsp.', isBasis: true }
    ],
    instructions: [
      'Svits hakket løg og presset hvidløg i lidt olie i en gryde.',
      'Tilsæt hakket oksekød og lad det brune godt under omrøring.',
      'Hæld de hakkede tomater i og lad kødsovsen simre ved svag varme i 15 minutter. Smag til med salt og peber.',
      'Læg lasagnen sammen i et ovnfast fad ved at skifte mellem kødsovs, lasagneplader, en smule mælk og revet ost.',
      'Slut af med et generøst lag ost på toppen.',
      'Bag lasagnen i ovnen ved 200°C i ca. 25-30 minutter, til pladerne er møre, og osten er gylden.'
    ]
  },
  {
    id: 'rec2',
    name: 'Cremet Pasta Carbonara',
    description: 'En lynhurtig romersk klassiker med sprød bacon og cremet parmesan-sauce.',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=80',
    prepTime: 20,
    servings: 2,
    tags: ['Hurtig', 'Italiensk', 'Mindre end 30 min'],
    healthScore: 3,
    tips: {
      healthier: 'Brug fuldkornspasta i stedet for hvid spaghetti. Det giver langsommere kulhydrater, en bedre mæthedsfornemmelse og flere kostfibre.',
      cheaper: 'Køb bacon i skiver frem for færdige tern – ugesedlerne har næsten altid 100g eller 120g pakker til helt ned til 7-9 kr. i Netto.'
    },
    ingredients: [
      { name: 'Pasta', displayName: 'Spaghetti n. 5', amount: '250g' },
      { name: 'Bacon', displayName: 'Sprød bacon i skiver/tern', amount: '150g' },
      { name: 'Madlavningsfløde', displayName: 'Madlavningsfløde 18%', amount: '1.5 dl' },
      { name: 'Æg', displayName: 'Friske æg', amount: '2 stk', isBasis: true },
      { name: 'Ost', displayName: 'Revet skæreost eller parmesan', amount: '50g' },
      { name: 'Salt & Peber', displayName: 'Groft kværnet sort peber', amount: '1 tsk', isBasis: true }
    ],
    instructions: [
      'Kog spaghettien al dente i rigeligt saltet vand efter pakkens anvisning.',
      'Steg baconen sprød på en tør pande. Let den dryppe af på et stykke køkkenrulle.',
      'Pisk æg, madlavningsfløde og revet ost sammen i en skål, og krydr med masser og sort peber.',
      'Hæld vandet fra spaghettien, men gem en smule pastavand.',
      'Tag panden af varmen. Hæld spaghettien og baconen over i skålen med æggeblandingen, og vend det hurtigt rundt, så æggemassen cremer sig uden at koagulere (tilsæt evt. en skefuld pastavand).',
      'Server med det samme med ekstra ost på toppen.'
    ]
  },
  {
    id: 'rec3',
    name: 'Boller i Karry',
    description: 'En elsket dansk familieret med krydrede kødboller i en fløjlsblød karrysauce.',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80',
    prepTime: 40,
    servings: 4,
    tags: ['Klassisk', 'Dansk', 'Familievenlig'],
    healthScore: 6,
    tips: {
      healthier: 'Server retten med brune ris eller blomkålsris, og tilsæt ekstra revet æble og fintsnittet porre direkte i karrysaucen.',
      cheaper: 'Du kan spæde svinefarsen op med havregryn og revet kartoffel. Det øger volumen betydeligt og sparer ca. 12 kr. på kødet.'
    },
    ingredients: [
      { name: 'Hakket svinekød', displayName: 'Hakket svine- & kalvekød', amount: '500g' },
      { name: 'Ris', displayName: 'Jasmin ris', amount: '300g' },
      { name: 'Letmælk', displayName: 'Økologisk letmælk', amount: '3 dl' },
      { name: 'Løg', displayName: 'Løg', amount: '1 stk', isBasis: true },
      { name: 'Æble', displayName: 'Frisk æble (revet)', amount: '1 stk' },
      { name: 'Mel & Karry', displayName: 'Karry og mel', amount: '2 spsk', isBasis: true },
      { name: 'Smør', displayName: 'Lurpak Smørbar', amount: '25g' },
      { name: 'Salt & Peber', displayName: 'Salt og peber', amount: '1 tsk', isBasis: true }
    ],
    instructions: [
      'Rør hakket kød med fintsnittet løg, 1 dl mælk, salt og peber til en fast fars. Lad den hvile i 10 min.',
      'Bring en gryde med saltet vand i kog. Form farsen til små boller med en ske, og lad dem simre i vandet i ca. 8-10 minutter, til de stiger til overfladen. Tag dem op, men gem kogevandet.',
      'Smelt smør i en anden gryde og brænd karryen af. Rør mel i til en smørbolle.',
      'Tilsæt kogevandet fra kødbollerne lidt efter lidt under konstant piskning, efterfulgt af de resterende 2 dl mælk, til saucen har den rette konsistens.',
      'Tilsæt det revne æble for at give saucen en dejlig sødme. Læg kødbollerne i saucen og lad det simre i 5 minutter.',
      'Server med dampende varme jasmin ris.'
    ]
  },
  {
    id: 'rec4',
    name: 'Kylling i cremet Karry',
    description: 'Møre kyllingestykker og friske grøntsager i en cremet, krydret karrysauce.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&auto=format&fit=crop&q=80',
    prepTime: 30,
    servings: 4,
    tags: ['Sund', 'Hurtig', 'Mindre end 30 min'],
    healthScore: 8,
    tips: {
      healthier: 'Erstat madlavningsfløde 18% med kokosmælk light eller græsk yoghurt (rørt i til sidst) for at reducere mængden af mættet fedt.',
      cheaper: 'Køb frossen kyllingebryst på tilbud og optø det – det er ofte 20-30% billigere end ferske kyllingefileter.'
    },
    ingredients: [
      { name: 'Kyllingebrystfilet', displayName: 'Kyllingebrystfilet', amount: '450g' },
      { name: 'Ris', displayName: 'Jasmin ris', amount: '300g' },
      { name: 'Madlavningsfløde', displayName: 'Madlavningsfløde 18%', amount: '2.5 dl' },
      { name: 'Porrer', displayName: 'Friske porrer', amount: '2 stk' },
      { name: 'Gulerødder', displayName: 'Danske gulerødder', amount: '3 stk' },
      { name: 'Karry & Olie', displayName: 'Karry og madolie', amount: '2 spsk', isBasis: true },
      { name: 'Salt & Peber', displayName: 'Salt og peber', amount: 'Knsp.', isBasis: true }
    ],
    instructions: [
      'Kog jasmin risene efter anvisningen på pakken.',
      'Skær kyllingebrystfileterne i mundrette bidder. Rens porrer og gulerødder, og skær dem i skiver.',
      'Varm olie op i en dyb pande eller wok. Brænd karryen af i olien, til det dufter kraftigt.',
      'Tilsæt kyllingestykkerne og brun dem godt på alle sider.',
      'Tilsæt porrer og gulerødder og svits det med i 3-4 minutter.',
      'Hæld madlavningsfløden ved og lad retten simre under låg i ca. 10 minutter, indtil grøntsagerne er møre og kyllingen er gennemstegt.',
      'Smag til med salt og peber, og server sammen med risene.'
    ]
  },
  {
    id: 'rec5',
    name: 'Vegetarisk Indisk Dahl',
    description: 'En nærende og krydret indisk dahl lavet på røde linser og kokosmælk. Perfekt hverdagsmad.',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
    prepTime: 25,
    servings: 3,
    tags: ['Vegetarisk', 'Sund', 'Billig'],
    healthScore: 9,
    tips: {
      healthier: 'Tilsæt en stor håndfuld frisk spinat til sidst og lad den falde sammen i gryden. Server med brune basmati ris.',
      cheaper: 'Tørrede røde linser koster under 10 kr. pr. pose i Rema 1000 og Coop 365. Lav dobbelt portion og frys ned som sund fastfood!'
    },
    ingredients: [
      { name: 'Tørrede røde linser', displayName: 'Tørrede røde linser', amount: '250g' },
      { name: 'Dåse hakkede tomater', displayName: 'Hakkede tomater', amount: '1 dåse (400g)' },
      { name: 'Porrer', displayName: 'Fintsnittet porre', amount: '1 stk' },
      { name: 'Løg', displayName: 'Løg', amount: '1 stk', isBasis: true },
      { name: 'Hvidløg', displayName: 'Hvidløgsfed', amount: '3 stk', isBasis: true },
      { name: 'Ingefær', displayName: 'Frisk ingefær', amount: '1 tsk', isBasis: true },
      { name: 'Karry, spidskommen & gurkemeje', displayName: 'Krydderiblanding', amount: '1 spsk', isBasis: true },
      { name: 'Mælk', displayName: 'Vand eller mælk for cremethed', amount: '3 dl' }
    ],
    instructions: [
      'Hak løg og hvidløg fint. Skær porren i tynde ringe. Riv ingefæren fint.',
      'Varm lidt olie i en stor gryde, og svits løg, hvidløg, porrer og ingefær i 3-4 minutter.',
      'Tilsæt krydderierne (karry, spidskommen, gurkemeje) og lad dem riste med i 1 minut.',
      'Skyl de røde linser grundigt i koldt vand. Tilsæt linserne, de hakkede tomater samt vand/mælk.',
      'Bring gryden i kog, skru ned for varmen, og lad dahlen simre under låg i ca. 15-20 minutter, til linserne er bløde og har opsuget væsken. Rør rundt jævnligt.',
      'Smag til med salt, peber og eventuelt lidt citronsaft. Server rygende varm i dybe skåle.'
    ]
  },
  {
    id: 'rec6',
    name: 'Ovnbagt Laks med Porre og Fløde',
    description: 'En utrolig nem og delikat ret, hvor laksen bages i et fad på en bund af cremet porresauce.',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=80',
    prepTime: 25,
    servings: 2,
    tags: ['Nem', 'Fisk', 'Sund'],
    healthScore: 7,
    tips: {
      healthier: 'Reducer mængden af madlavningsfløde, brug ekstra citronsaft og drys med frisk dild for en kaloriefattig version.',
      cheaper: 'Køb en hel lakseside på tilbud i Meny eller Føtex, skær den selv ud i steaks og frys ned. Det sparer over 20-30 kr. pr. kilo!'
    },
    ingredients: [
      { name: 'Frisk laksesteak', displayName: 'Friske laksesteaks', amount: '2 stk (250g)' },
      { name: 'Friske porrer', displayName: 'Porrer', amount: '2 stk' },
      { name: 'Madlavningsfløde', displayName: 'Madlavningsfløde 18%', amount: '2 dl' },
      { name: 'Økologiske citroner', displayName: 'Citronsaft', amount: '1 spsk' },
      { name: 'Salt & Peber', displayName: 'Salt og peber', amount: 'Knsp.', isBasis: true }
    ],
    instructions: [
      'Rens porrerne grundigt og skær dem i ringe på ca. 0.5 cm.',
      'Fordel porreringene i bunden af et ovnfast fad.',
      'Hæld madlavningsfløde og saften fra en halv citron over porrerne, og krydr med lidt salt og peber.',
      'Læg laksesteaksene oven på porrebunden, og pres også lidt citronsaft ud over fisken. Krydr med salt og peber.',
      'Stil fadet i en forvarmet ovn ved 180°C varmluft og bag retten i 15-18 minutter, til laksen er gennembagt, og fløden bobler.',
      'Server eventuelt med kogte kartofler eller sprødt brød.'
    ]
  }
];

// Database pools that the interactive SCRAPER adds to the active database
export const SCRAPED_DEALS_POOL: Deal[] = [
  // Meny
  {
    id: 'sc_m1',
    item: 'Hakket oksekød 8-12%',
    price: 29, // Super strong price! Meny wins Hakket Oksekød match
    normalPrice: 50,
    saving: 21,
    store: 'Meny',
    category: 'Kød & Fisk',
    unit: '400g',
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'sc_m2',
    item: 'Danske piskefløde 38%',
    price: 12,
    normalPrice: 22,
    saving: 10,
    store: 'Meny',
    category: 'Mejeri & Æg',
    unit: '500ml',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=60'
  },

  // Rema 1000
  {
    id: 'sc_r1',
    item: 'Økologiske æg',
    price: 18,
    normalPrice: 28,
    saving: 10,
    store: 'Rema 1000',
    category: 'Mejeri & Æg',
    unit: '10 stk',
    imageUrl: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'sc_r2',
    item: 'Lasagneplader durum',
    price: 6,
    normalPrice: 12,
    saving: 6,
    store: 'Rema 1000',
    category: 'Kolonial & Konserves',
    unit: '500g',
    imageUrl: 'https://images.unsplash.com/photo-1612966608997-30d411b4e9d7?w=300&auto=format&fit=crop&q=60'
  },

  // Netto
  {
    id: 'sc_n1',
    item: 'Kærgården Smørbar',
    price: 9, // Absolute crazy deal!
    normalPrice: 23,
    saving: 14,
    store: 'Netto',
    category: 'Mejeri & Æg',
    unit: '250g',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'sc_n2',
    item: 'Bacon i skiver',
    price: 7, // Makes Carbonara super cheap!
    normalPrice: 14,
    saving: 7,
    store: 'Netto',
    category: 'Kød & Fisk',
    unit: '120g',
    imageUrl: 'https://images.unsplash.com/photo-1606851264091-a5fb8d3395aa?w=300&auto=format&fit=crop&q=60'
  },

  // Lidl
  {
    id: 'sc_l1',
    item: 'Kokosmælk økologisk',
    price: 6,
    normalPrice: 12,
    saving: 6,
    store: 'Lidl',
    category: 'Kolonial & Konserves',
    unit: '400ml',
    imageUrl: 'https://images.unsplash.com/photo-1541795795328-f073b763494e?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'sc_l2',
    item: 'Frisk ingefær',
    price: 5,
    normalPrice: 12,
    saving: 7,
    store: 'Lidl',
    category: 'Grøntsager & Frugt',
    unit: '250g',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=60'
  },

  // Coop 365
  {
    id: 'sc_c1',
    item: 'Rugbrød softkerne',
    price: 8,
    normalPrice: 16,
    saving: 8,
    store: 'Coop 365',
    category: 'Brød & Kager',
    unit: '900g',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=60'
  },

  // Føtex
  {
    id: 'sc_f1',
    item: 'Danske kartofler',
    price: 8,
    normalPrice: 15,
    saving: 7,
    store: 'Føtex',
    category: 'Grøntsager & Frugt',
    unit: '2 kg',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=60'
  }
];

export const SCRAPED_RECIPES_POOL: Recipe[] = [
  {
    id: 'rec_sc_1',
    name: 'Cremet Kylling i Kokosmælk',
    description: 'En sund, nem og cremet wokret med mør kylling, sprøde gulerødder og asiatiske undertoner.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&auto=format&fit=crop&q=80',
    prepTime: 25,
    servings: 4,
    tags: ['Asiatisk', 'Sund', 'Scrapet'],
    healthScore: 8,
    tips: {
      healthier: 'Brug kokosmælk light frem for almindelig kokosmælk for at skære ned på kalorierne, og tilsæt ekstra porrer og broccoli.',
      cheaper: 'Wokretter er geniale til grøntsagsskuffens rester! Brug ugens ugetilbud på løg eller peberfrugt for at spare penge.'
    },
    ingredients: [
      { name: 'Kyllingebrystfilet', displayName: 'Kyllingebrystfilet', amount: '450g' },
      { name: 'Kokosmælk økologisk', displayName: 'Kokosmælk', amount: '1 dåse (400ml)' },
      { name: 'Danske gulerødder', displayName: 'Gulerødder', amount: '3 stk' },
      { name: 'Friske porrer', displayName: 'Porre', amount: '1 stk' },
      { name: 'Frisk ingefær', displayName: 'Ingefær (revet)', amount: '1 tsk' },
      { name: 'Ris', displayName: 'Jasmin ris', amount: '300g' }
    ],
    instructions: [
      'Kog risene som anvist på pakken.',
      'Skær kylling i tynde strimler og svits det i lidt olie i en dyb pande sammen med revet ingefær.',
      'Tilsæt porre i ringe og gulerødder i tynde stave, og svits i yderligere 3 minutter.',
      'Hæld den cremede kokosmælk over og lad det hele simre ved middel varme under låg i 10 minutter.',
      'Smag til med salt, peber og evt. sojasovs. Server ovenpå risene.'
    ]
  },
  {
    id: 'rec_sc_2',
    name: 'Smørrebrød med Laks & Avocado',
    description: 'En lynhurtig, luksuriøs og minimalistisk frokostret, der ser fantastisk ud.',
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=80',
    prepTime: 10,
    servings: 2,
    tags: ['Frokost', 'Hurtig', 'Uden ovn'],
    healthScore: 9,
    tips: {
      healthier: 'Brug et 100% økologisk fuldkornsrugbrød for at få flest mulige fibre og den længste mæthedsfornemmelse.',
      cheaper: 'Hvis frisk laksesteak er for dyrt, kan du erstatte det med dåsetun eller makrel i tomat af høj kvalitet (sparer ca. 18 kr.).'
    },
    ingredients: [
      { name: 'Rugbrød softkerne', displayName: 'Rugbrød softkerne', amount: '2 skiver' },
      { name: 'Frisk laksesteak', displayName: 'Varmrøget eller dampet laks', amount: '120g' },
      { name: 'Avocado', displayName: 'Moden avocado', amount: '1 stk' },
      { name: 'Økologiske citroner', displayName: 'Citronskive til pynt', amount: '1/2 stk' },
      { name: 'Lurpak Smørbar', displayName: 'Lurpak smør til brødet', amount: '10g' }
    ],
    instructions: [
      'Smør de to skiver friske rugbrød med et tyndt lag Lurpak smør.',
      'Halver avocadoen, fjern stenen, skær kødet i tynde skiver og fordel det pænt på brødskiverne.',
      'Bræk den tilberedte laks i mindre stykker og anret dem dekorativt oven på avocadoen.',
      'Krydr med lidt salt, friskkværnet sort peber og et par dråber citronsaft.',
      'Pynt med en citronskive og server med det samme.'
    ]
  }
];
