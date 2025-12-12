/* 
    ============================================
    SOULTOUCH ZA - PRODUCT DATA
    ============================================
    
    Single source of truth for all product data.
    To add a new product, simply add a new object to the PRODUCTS array below.
    
    Each product must have:
    - id: unique numeric identifier
    - brand: "Nike", "Puma", or "Adidas"
    - name: product name
    - price: numeric price (will be formatted as R####)
    - images: array of image paths (multiple angles)
    - sizes: array of available sizes
    - description: product description
    - tags: optional array of tags for filtering
*/

const PRODUCTS = [
    // NIKE (26 products)
    {
        id: 1,
        brand: "Nike",
        name: "Air Force 1 '07",
        price: 2799,
        images: [
            "assets/Nike Air Force 1 '07 Men's Shoes. Nike ZA/imgi_38_AIR+FORCE+1+'07.png",
            "assets/Nike Air Force 1 '07 Men's Shoes. Nike ZA/imgi_45_AIR+FORCE+1+'07.png",
            "assets/Nike Air Force 1 '07 Men's Shoes. Nike ZA/imgi_51_AIR+FORCE+1+'07.png"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Premium leather upper, classic Air cushioning, everyday comfort and durability. The timeless design that started it all.",
        tags: ["nike", "air-force-1", "classic"]
    },
    {
        id: 58,
        brand: "Puma",
        name: "Suede XL",
        price: 2199,
        images: [
            "assets/PUMA Suede XL _ Shelflife/imgi_23_1019492_1019492-Blac_01.jpg",
            "assets/PUMA Suede XL _ Shelflife/imgi_24_1019492_1019492-Blac_02.jpg",
            "assets/PUMA Suede XL _ Shelflife/imgi_26_1019492_1019492-Blac_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "21st century update of the iconic Suede. Premium suede upper with modern comfort features and timeless style.",
        tags: ["puma", "suede", "classic"]
    },
    {
        id: 61,
        brand: "Adidas",
        name: "Campus 00's",
        price: 2599,
        images: [
            "assets/adidas Campus 00's _ Shelflife/imgi_23_1016214_1016214-300_01.jpg",
            "assets/adidas Campus 00's _ Shelflife/imgi_26_1016214_1016214-300_04.jpg",
            "assets/adidas Campus 00's _ Shelflife/imgi_27_1016214_1016214-300_05.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Y2K era design reimagined. Premium suede construction with retro colorways and modern comfort technology.",
        tags: ["adidas", "campus", "y2k"]
    },
    {
        id: 43,
        brand: "Nike",
        name: "Air Jordan 1 Low 'Mint Candy'",
        price: 2999,
        images: [
            "assets/Air Jordan 1 Low 'Mint Candy' (Grade-School) _ Shelflife/imgi_23_1017401_1017401-Sail_01.jpg",
            "assets/Air Jordan 1 Low 'Mint Candy' (Grade-School) _ Shelflife/imgi_24_1017401_1017401-Sail_02.jpg",
            "assets/Air Jordan 1 Low 'Mint Candy' (Grade-School) _ Shelflife/imgi_26_1017401_1017401-Sail_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Fresh mint candy colorway on the iconic Air Jordan 1 Low. Premium leather construction with classic Wings logo and Air cushioning.",
        tags: ["nike", "jordan", "low"]
    },
    {
        id: 44,
        brand: "Nike",
        name: "Air Jordan 1 Mid 'Light Smoke Grey'",
        price: 3199,
        images: [
            "assets/Air Jordan 1 Mid 'Light Smoke Grey' _ Shelflife/imgi_23_1017701_1017701-Wht_01.jpg",
            "assets/Air Jordan 1 Mid 'Light Smoke Grey' _ Shelflife/imgi_24_1017701_1017701-Wht_02.jpg",
            "assets/Air Jordan 1 Mid 'Light Smoke Grey' _ Shelflife/imgi_26_1017701_1017701-Wht_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Elegant light smoke grey colorway on the classic Air Jordan 1 Mid. Premium materials with timeless design and superior comfort.",
        tags: ["nike", "jordan", "mid"]
    },
    {
        id: 45,
        brand: "Nike",
        name: "Air Jordan 1 Women's Low 'Aluminium'",
        price: 2899,
        images: [
            "assets/Air Jordan 1 Women'S Low 'Aluminium' _ Shelflife/imgi_23_1017272_1017272-Wht_01.jpg",
            "assets/Air Jordan 1 Women'S Low 'Aluminium' _ Shelflife/imgi_24_1017272_1017272-Wht_02.jpg",
            "assets/Air Jordan 1 Women'S Low 'Aluminium' _ Shelflife/imgi_26_1017272_1017272-Wht_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Sophisticated aluminium colorway designed for women. Premium leather upper with classic Air Jordan 1 Low silhouette.",
        tags: ["nike", "jordan", "women"]
    },
    {
        id: 46,
        brand: "Nike",
        name: "Air Max 95 Big Bubble",
        price: 3499,
        images: [
            "assets/Nike Air Max 95 'Big Bubble' Men's Shoes. Nike ZA/imgi_41_NIKE+AIR+MAX+95+BIG+BUBBLE.png",
            "assets/Nike Air Max 95 'Big Bubble' Men's Shoes. Nike ZA/imgi_52_NIKE+AIR+MAX+95+BIG+BUBBLE.png",
            "assets/Nike Air Max 95 'Big Bubble' Men's Shoes. Nike ZA/imgi_60_NIKE+AIR+MAX+95+BIG+BUBBLE.png"
        ],
        sizes: [7, 8, 9, 10, 11],
        description: "Iconic Air Max 95 with enhanced Big Bubble visible Air unit. Revolutionary gradient design with maximum cushioning and style.",
        tags: ["nike", "air-max", "big-bubble"]
    },
    {
        id: 47,
        brand: "Nike",
        name: "Air Max 95 'Greedy'",
        price: 3399,
        images: [
            "assets/Nike Nike Air Max 95 'Greedy' _ 810374-078/imgi_5_59567b91-3765-44f3-a743-bdfff7d4b9fc.webp",
            "assets/Nike Nike Air Max 95 'Greedy' _ 810374-078/imgi_5_59567b91-3765-44f3-a743-bdfff7d4b9fc.webp",
            "assets/Nike Nike Air Max 95 'Greedy' _ 810374-078/imgi_5_59567b91-3765-44f3-a743-bdfff7d4b9fc.webp"
        ],
        sizes: [7, 8, 9, 10, 11],
        description: "Bold 'Greedy' colorway featuring vibrant multi-color design. Classic Air Max 95 silhouette with premium materials and maximum Air cushioning.",
        tags: ["nike", "air-max", "greedy"]
    },
    {
        id: 48,
        brand: "Nike",
        name: "Air Max Portal",
        price: 2699,
        images: [
            "assets/Nike Nike Air Max Portal _ HF3053-008/imgi_7_4cb7426c-d05b-442a-b5bb-861af396994c.webp",
            "assets/Nike Nike Air Max Portal _ HF3053-008/imgi_24_01e94a7f-b38e-4f05-9e22-54935473a2bc.webp",
            "assets/Nike Nike Air Max Portal _ HF3053-008/imgi_25_392c1f15-4461-4095-a393-92035b41ed53.webp"
            
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Futuristic design with visible Air Max cushioning. Lightweight construction with premium materials for all-day wear.",
        tags: ["nike", "air-max", "portal"]
    },
    {
        id: 49,
        brand: "Nike",
        name: "Air Max Portal (White)",
        price: 2699,
        images: [
            "assets/Nike Chaussure Nike Air Max Portal pour femmeBlanc _ HF3053-107/imgi_7_896dd70d-dc6b-4c35-b09e-95ab340ed1d7.webp",
            "assets/Nike Chaussure Nike Air Max Portal pour femmeBlanc _ HF3053-107/imgi_25_ec7268c2-e6cf-4d63-bc0b-610035371a80.webp",
            "assets/Nike Chaussure Nike Air Max Portal pour femmeBlanc _ HF3053-107/imgi_26_f8d2a86e-3bde-473b-906b-e078e472fded.webp"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Clean white colorway of the Air Max Portal designed for women. Modern aesthetic with visible Air cushioning and premium comfort.",
        tags: ["nike", "air-max", "women"]
    },
    {
        id: 50,
        brand: "Nike",
        name: "Air Max Portal (Dark Blue)",
        price: 2799,
        images: [
            "assets/Nike Nike Air Max Portal Dark Blue Brand New 2 _ HF3053-005/imgi_24_32333204-6b1a-4e30-8a9a-e5fd3b754745.webp",
            "assets/Nike Nike Air Max Portal Dark Blue Brand New 2 _ HF3053-005/imgi_25_d368e42a-dfc9-471c-9f62-55d5196300a4.webp",
            "assets/Nike Nike Air Max Portal Dark Blue Brand New 2 _ HF3053-005/imgi_7_f8b478d4-a1c3-4ad7-bea4-36163931e1df.webp"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Bold dark blue colorway of the Air Max Portal. Futuristic design with visible Air Max technology and premium materials.",
        tags: ["nike", "air-max", "blue"]
    },
    {
        id: 51,
        brand: "Nike",
        name: "Air Max Portal (Vintage Green)",
        price: 2799,
        images: [
            "assets/Nike Nike Air Max Portal Vintage Green Bicoastal Soft Pearl (Women's) _ HF3053-300/imgi_24_6f526701-6ccf-4743-977b-6b5ee2a134f4.webp",
            "assets/Nike Nike Air Max Portal Vintage Green Bicoastal Soft Pearl (Women's) _ HF3053-300/imgi_25_68ea0259-1596-4211-b147-8d27ae9e256a.webp",
            "assets/Nike Nike Air Max Portal Vintage Green Bicoastal Soft Pearl (Women's) _ HF3053-300/imgi_7_a646021e-0ab6-4b40-991d-a5645ae62a77.webp"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Vintage green colorway with soft pearl accents. Designed for women with modern comfort and timeless style.",
        tags: ["nike", "air-max", "vintage"]
    },
    {
        id: 52,
        brand: "Nike",
        name: "Women's Air Force 1 '07 Vintage 'Triple Black'",
        price: 2899,
        images: [
            "assets/Nike Women's Air Force 1 '07 Vintage 'Triple Black' _ Shelflife/imgi_23_1018909_1018909-Blac_01.jpg",
            "assets/Nike Women's Air Force 1 '07 Vintage 'Triple Black' _ Shelflife/imgi_24_1018909_1018909-Blac_02.jpg",
            "assets/Nike Women's Air Force 1 '07 Vintage 'Triple Black' _ Shelflife/imgi_26_1018909_1018909-Blac_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Classic Air Force 1 in triple black vintage finish. Premium leather construction with timeless design and everyday comfort.",
        tags: ["nike", "air-force-1", "vintage"]
    },
    {
        id: 53,
        brand: "Nike",
        name: "Women's Air Max SNDR 'Safety Orange'",
        price: 2999,
        images: [
            "assets/Nike Women's Air Max SNDR 'Safety Orange' _ Shelflife/imgi_24_1016459_1016459-Ora_010.jpg",
            "assets/Nike Women's Air Max SNDR 'Safety Orange' _ Shelflife/imgi_27_1016459_1016459-Ora_03.jpg",
            "assets/Nike Women's Air Max SNDR 'Safety Orange' _ Shelflife/imgi_28_1016459_1016459-Ora_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Bold safety orange colorway on the Air Max SNDR. Modern design with visible Air cushioning and vibrant style.",
        tags: ["nike", "air-max", "orange"]
    },
    {
        id: 54,
        brand: "Nike",
        name: "Women's Air Max SNDR 'Silver & Anthracite'",
        price: 2999,
        images: [
            "assets/Nike Women'S Air Max SNDR 'Silver & Anthracite' _ Shelflife/imgi_24_1018476_1018476-Silv_010.jpg",
            "assets/Nike Women'S Air Max SNDR 'Silver & Anthracite' _ Shelflife/imgi_26_1018476_1018476-Silv_02.jpg",
            "assets/Nike Women'S Air Max SNDR 'Silver & Anthracite' _ Shelflife/imgi_28_1018476_1018476-Silv_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Elegant silver and anthracite colorway. Modern Air Max SNDR design with premium materials and superior comfort.",
        tags: ["nike", "air-max", "silver"]
    },
    {
        id: 55,
        brand: "Nike",
        name: "Women's Shox TL 'White & Max Orange'",
        price: 3099,
        images: [
            "assets/Nike Women's Shox TL 'White & Max Orange' _ Shelflife/imgi_23_1015762_1015762-Wht_01.jpg",
            "assets/Nike Women's Shox TL 'White & Max Orange' _ Shelflife/imgi_24_1015762_1015762-Wht_02.jpg",
            "assets/Nike Women's Shox TL 'White & Max Orange' _ Shelflife/imgi_26_1015762_1015762-Wht_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10],
        description: "Vibrant white and max orange colorway on the Shox TL. Revolutionary Shox technology with bold design and superior impact protection.",
        tags: ["nike", "shox", "orange"]
    },
    {
        id: 56,
        brand: "Nike",
        name: "Shox TL 'Clay Grey'",
        price: 3199,
        images: [
            "assets/Nike Shox TL 'Clay Grey' _ Shelflife/imgi_23_1018888_1018888-Grey_01.jpg",
            "assets/Nike Shox TL 'Clay Grey' _ Shelflife/imgi_24_1018888_1018888-Grey_02.jpg",
            "assets/Nike Shox TL 'Clay Grey' _ Shelflife/imgi_26_1018888_1018888-Grey_04.jpg"
        ],
        sizes: [7, 8, 9, 10, 11],
        description: "Sophisticated clay grey colorway on the Shox TL. Revolutionary Shox technology delivers responsive cushioning with elegant design.",
        tags: ["nike", "shox", "grey"]
    },
  
    
    // PUMA (15 products)
    {
        id: 57,
        brand: "Puma",
        name: "Speedcat",
        price: 2899,
        images: [
            "assets/PUMA Speedcat _ Shelflife/imgi_23_1019495_1019495-Blac_01.jpg",
            "assets/PUMA Speedcat _ Shelflife/imgi_24_1019495_1019495-Blac_02.jpg",
            "assets/PUMA Speedcat _ Shelflife/imgi_26_1019495_1019495-Blac_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Racing heritage meets street style. Low-profile design with premium materials and iconic Speedcat branding for timeless appeal.",
        tags: ["puma", "speedcat", "racing"]
    },
    {
        id: 58,
        brand: "Puma",
        name: "Suede XL",
        price: 2199,
        images: [
            "assets/PUMA Suede XL _ Shelflife/imgi_23_1019492_1019492-Blac_01.jpg",
            "assets/PUMA Suede XL _ Shelflife/imgi_24_1019492_1019492-Blac_02.jpg",
            "assets/PUMA Suede XL _ Shelflife/imgi_26_1019492_1019492-Blac_04.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "21st century update of the iconic Suede. Premium suede upper with modern comfort features and timeless style.",
        tags: ["puma", "suede", "classic"]
    },
    {
        id: 59,
        brand: "Puma",
        name: "Suede XL (Blue)",
        price: 2199,
        images: [
            "assets/Suede XL Sneakers Unisex _ blue _ PUMA South Africa/imgi_1_png.jpeg",
            "assets/Suede XL Sneakers Unisex _ blue _ PUMA South Africa/imgi_2_png.jpeg",
            "assets/Suede XL Sneakers Unisex _ blue _ PUMA South Africa/imgi_6_png.jpeg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Classic Suede XL in vibrant blue. Premium suede upper with timeless Puma Formstrip and exceptional comfort.",
        tags: ["puma", "suede", "blue"]
    },
 
    
    // ADIDAS (12 products)

    {
        id: 60,
        brand: "Adidas",
        name: "Samba OG (Black)",
        price: 2799,
        images: [
            "assets/Shoes - Samba OG Shoes - Black _ adidas South Africa/imgi_28_B75807_09_standard.jpg",
            "assets/Shoes - Samba OG Shoes - Black _ adidas South Africa/imgi_38_B75807_06_standard.jpg",
            "assets/Shoes - Samba OG Shoes - Black _ adidas South Africa/imgi_39_B75807_07_standard.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Original football-inspired design in classic black. Premium suede and leather construction with timeless style and comfort.",
        tags: ["adidas", "samba", "black"]
    },
    {
        id: 61,
        brand: "Adidas",
        name: "Campus 00's",
        price: 2599,
        images: [
            "assets/adidas Campus 00's _ Shelflife/imgi_23_1016214_1016214-300_01.jpg",
            "assets/adidas Campus 00's _ Shelflife/imgi_26_1016214_1016214-300_04.jpg",
            "assets/adidas Campus 00's _ Shelflife/imgi_27_1016214_1016214-300_05.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Y2K era design reimagined. Premium suede construction with retro colorways and modern comfort technology.",
        tags: ["adidas", "campus", "y2k"]
    },
    
    // NEW JORDAN & NIKE ASSETS
    {
        id: 62,
        brand: "Nike",
        name: "Air Jordan 4 Retro 'Military Black'",
        price: 3599,
        images: [
            "assets/Air jordan 4 _Military Black_ _ Fashioncrib SA/imgi_6_1000064722.jpg",
            "assets/Air jordan 4 _Military Black_ _ Fashioncrib SA/imgi_74_Air-Jordan-4-Retro-Military-Black-1_840x-768x768.jpg",
            "assets/Air jordan 4 _Military Black_ _ Fashioncrib SA/imgi_8_Air-Jordan-4-Retro-Military-Black-8_840x.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Sleek Military Black colorway on the classic Jordan 4 with premium materials and responsive cushioning.",
        tags: ["nike", "jordan", "military-black"]
    },
    {
        id: 63,
        brand: "Nike",
        name: "Air Jordan 4 Retro 'Red Thunder'",
        price: 3599,
        images: [
            "assets/Air Jordan 4 Retro 'Red Thunder'/imgi_3_791362_03.jpg.jpg",
            "assets/Air Jordan 4 Retro 'Red Thunder'/imgi_6_791362_06.jpg.jpg",
            "assets/Air Jordan 4 Retro 'Red Thunder'/imgi_8_791362_08.jpg.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Bold Red Thunder blocking on the Jordan 4 silhouette with classic Air cushioning and durable build.",
        tags: ["nike", "jordan", "red-thunder"]
    },
    {
        id: 64,
        brand: "Nike",
        name: "Air Jordan 1 Retro High OG 'Dark Mocha'",
        price: 3299,
        images: [
            "assets/Buy Air Jordan 1 Retro High OG 'Dark Mocha' - 555088 105 _ GOAT/imgi_1_567948_01.jpg.jpg",
            "assets/Buy Air Jordan 1 Retro High OG 'Dark Mocha' - 555088 105 _ GOAT/imgi_3_567948_03.jpg.jpg",
            "assets/Buy Air Jordan 1 Retro High OG 'Dark Mocha' - 555088 105 _ GOAT/imgi_8_567948_08.jpg.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Coveted Dark Mocha colorway on the Air Jordan 1 High with premium leather and timeless design.",
        tags: ["nike", "jordan", "dark-mocha"]
    },
    {
        id: 65,
        brand: "Nike",
        name: "Air Jordan 4 Retro 'Black Cat' (2020)",
        price: 3699,
        images: [
            "assets/Buy Air Jordan 4 Retro 'Black Cat' 2020 - CU1110 010 _ GOAT/imgi_11_529535_01.jpg.jpg",
            "assets/Buy Air Jordan 4 Retro 'Black Cat' 2020 - CU1110 010 _ GOAT/imgi_13_529535_03.jpg.jpg",
            "assets/Buy Air Jordan 4 Retro 'Black Cat' 2020 - CU1110 010 _ GOAT/imgi_8_529535_08.jpg.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Triple-black Black Cat Jordan 4 with stealth styling and plush Air cushioning.",
        tags: ["nike", "jordan", "black-cat"]
    },
    {
        id: 66,
        brand: "Nike",
        name: "Air Jordan 4 Retro 'University Blue'",
        price: 3699,
        images: [
            "assets/Buy Air Jordan 4 Retro 'University Blue' - CT8527 400 _ GOAT/imgi_1_631510_01.jpg.jpg",
            "assets/Buy Air Jordan 4 Retro 'University Blue' - CT8527 400 _ GOAT/imgi_3_631510_03.jpg.jpg",
            "assets/Buy Air Jordan 4 Retro 'University Blue' - CT8527 400 _ GOAT/imgi_8_631510_08.jpg.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "UNC-inspired University Blue Jordan 4 featuring premium suede and classic mesh panelling.",
        tags: ["nike", "jordan", "university-blue"]
    },
    {
        id: 67,
        brand: "Nike",
        name: "Air Jordan 4 Retro 'White Oreo'",
        price: 3699,
        images: [
            "assets/Jordan 4 Retro _White Oreo_ _ Fashioncrib SA/imgi_5_Air-Jordan-4-Retro-White-Oreo1_840x.jpg",
            "assets/Jordan 4 Retro _White Oreo_ _ Fashioncrib SA/imgi_6_Air-Jordan-4-Retro-White-Oreo8_840x.jpg",
            "assets/Jordan 4 Retro _White Oreo_ _ Fashioncrib SA/imgi_7_Air-Jordan-4-Retro-White-Oreo3_840x.jpg"
        ],
        sizes: [6, 7, 8, 9, 10, 11],
        description: "Clean White Oreo Jordan 4 with speckled accents and breathable mesh detailing.",
        tags: ["nike", "jordan", "white-oreo"]
    }
];

// Allow reuse in Node (seeding/API) without breaking browser usage
if (typeof module !== "undefined") {
    module.exports = { PRODUCTS };
}
