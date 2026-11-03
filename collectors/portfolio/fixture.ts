import type { PortfolioChannel } from "../../src/lib/data/types";

export type FixtureClaim = {
  key: string;
  quote: string;
};

export type FixtureCandidate = {
  subjectId: string;
  bodyKey: string;
  title: string;
  yearLabel: string | null;
  authorship: "own_work" | "judged_or_commented";
  channel: PortfolioChannel;
  url: string;
  pageTitle: string;
  excerpt: string | null;
  imageCount: number | null;
  imageCountNote: string;
  claims: FixtureClaim[];
};

export type FixtureLead = {
  subjectId: string;
  channel: PortfolioChannel;
  url: string;
  note: string;
};

const MOUNTAIN_ARTIST =
  "Mountain of Salt (2020-21) is an expansive body of work comprised of found images, appropriated text and digital shape collages, initially conceptualised as a human response to the unfolding of covid-19. The shapes that appear in the works aren’t only there to direct your gaze across the image or to pause in certain spaces.";

const MOUNTAIN_PUBLISHER =
  "Comprising found photographs and digital shape collages, each married to phrases and statements appropriated from news articles, press conferences, and social media.";

const MOUNTAIN_MUSEUM =
  "Mountain of Salt is an expansive body of work comprised of found images, appropriated text and digital shape collages. They are not only there to direct your gaze across the image or to pause in certain spaces.";

const WHITE_IN_THE_SEA =
  "white in the sea explores my intrigue and curiosity with the surface of the sea. Captured over the course of a single day, this study observes the water reflecting and refracting natural light. As the colours coalesce and flow into one another they become boundless, reflecting the shared nature of the sea. Utilising a 35mm film camera, this series sees digital techniques woven into the analogue process to intervene with the surface of the image.";

const COME_BACK =
  "Come Back even as a Shadow, Even as a Dream articulates the visceral emotions of grief in which the profoundly painful collides with the everyday whirring. Accompanying the text is a constellation of collages that fit together to form a map of kinds. Through elements of text and collage, the work emphasises the tensions between cultural mourning practices and the raw, tangible experiences of life, death, and grief. Archival images, India ink, gouache, palladium, Perspex and gloss Polaroid print on cut out BFK Rives paper.";

const TREES =
  "In a series of conjunctive collages made on Hampstead Heath that weave together countless walks and personal memories that embody a profound connection to nature, play and fauna. The grid roots conversations of difference as a reparative act. Sectional reproduction of Dido Elizabeth Belle’s portrait, drawing, coloured shapes, fragments of found postcards and images, on analogue photographs.";

const VILLAGE_WPO =
  "My favorite among the lot is “A village without men”. Well, as the name suggests, it is a village with no man living in it. These women, fleeing abuse from men and society have formed a village devoid of their abusers and enjoy their new lease of life.";

const VILLAGE_CNN =
  "In 2017, Ghanaian photographer Paul Ninson visited for his photo series, \"Village with No Men.\" The women of Samburu vary in age and many are survivors of gender-based violence.";

const FEEDING_GHANA =
  "“Feeding Ghana” is an ongoing project which seeks to bring to fore the front lines who work to feed the country and to showcase those who serve as the real backbone for our country’s economy.";

const NO_COUNT = "来源没有给出可核对的张数，不估计。";

export const PORTFOLIO_FIXTURE: FixtureCandidate[] = [
  {
    subjectId: "bindi-vora",
    bodyKey: "mountain-of-salt",
    title: "Mountain of Salt",
    yearLabel: "2020-21",
    authorship: "own_work",
    channel: "personal_site",
    url: "https://www.bindivora.co.uk/works/mountain-of-salt/",
    pageTitle: "Mountain of Salt, 2020-21",
    excerpt: MOUNTAIN_ARTIST,
    imageCount: null,
    imageCountNote: "作者页写 372 件，出版社介绍写 371-strong。两处数字不一致，不合并成一个张数。",
    claims: [
      { key: "found_or_archival_image", quote: "found images" },
      { key: "text_with_image", quote: "appropriated text" },
      { key: "collage", quote: "digital shape collages" },
      { key: "shape_directs_gaze", quote: "direct your gaze across the image or to pause in certain spaces" },
    ],
  },
  {
    subjectId: "bindi-vora",
    bodyKey: "mountain-of-salt",
    title: "Mountain of Salt",
    yearLabel: "2020-21",
    authorship: "own_work",
    channel: "publisher",
    url: "https://perimetereditions.com/bindi-vora-%E2%80%93-mountain-of-salt",
    pageTitle: "Bindi Vora – Mountain of Salt — Perimeter Editions",
    excerpt: MOUNTAIN_PUBLISHER,
    imageCount: null,
    imageCountNote: "出版社介绍写 371-strong，与作者页的 372 件不一致，不采用。",
    claims: [
      { key: "found_or_archival_image", quote: "found photographs" },
      { key: "collage", quote: "digital shape collages" },
      { key: "text_with_image", quote: "phrases and statements appropriated from news articles" },
    ],
  },
  {
    subjectId: "bindi-vora",
    bodyKey: "mountain-of-salt",
    title: "Mountain of Salt",
    yearLabel: "2020-21",
    authorship: "own_work",
    channel: "museum_gallery",
    url: "https://www.imperialcharity.org.uk/arts/exhibitions/looking-back-looking-forward/mountain-of-salt-bindi-vora",
    pageTitle: "Mountain of Salt: Bindi Vora - Imperial Health Charity",
    excerpt: MOUNTAIN_MUSEUM,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [
      { key: "found_or_archival_image", quote: "found images" },
      { key: "text_with_image", quote: "appropriated text" },
      { key: "collage", quote: "digital shape collages" },
      { key: "shape_directs_gaze", quote: "direct your gaze across the image or to pause in certain spaces" },
    ],
  },
  {
    subjectId: "bindi-vora",
    bodyKey: "white-in-the-sea",
    title: "white in the sea",
    yearLabel: "2013-ongoing",
    authorship: "own_work",
    channel: "personal_site",
    url: "https://www.bindivora.co.uk/works/white-in-the-sea-vol-i-xiv-2013-ongoing/",
    pageTitle: "white in the sea Vol I – XIV (2013-ongoing)",
    excerpt: WHITE_IN_THE_SEA,
    imageCount: null,
    imageCountNote: "作者页列出多个分卷，没有给总张数，不估计。",
    claims: [
      { key: "sea_surface", quote: "curiosity with the surface of the sea" },
      { key: "natural_light", quote: "the water reflecting and refracting natural light" },
      { key: "colour_as_pigment", quote: "As the colours coalesce and flow into one another" },
      {
        key: "analogue_with_digital",
        quote: "Utilising a 35mm film camera, this series sees digital techniques woven into the analogue process",
      },
    ],
  },
  {
    subjectId: "bindi-vora",
    bodyKey: "come-back-even-as-a-shadow",
    title: "Come Back Even as a Shadow. Even as a Dream",
    yearLabel: "2018-24",
    authorship: "own_work",
    channel: "personal_site",
    url: "https://www.bindivora.co.uk/works/come-back-even-as-a-shadow-even-as-a-dream-2018-24/",
    pageTitle: "Come Back Even as a Shadow. Even as a Dream (2018-24)",
    excerpt: COME_BACK,
    imageCount: null,
    imageCountNote: "页面写有 12 块文字面板，但没有把整件作品的张数说死，不估计。",
    claims: [
      { key: "grief_and_memory", quote: "articulates the visceral emotions of grief" },
      { key: "collage", quote: "a constellation of collages" },
      { key: "text_with_image", quote: "Through elements of text and collage" },
      { key: "found_or_archival_image", quote: "Archival images" },
    ],
  },
  {
    subjectId: "bindi-vora",
    bodyKey: "trying-to-touch-the-trees",
    title: "Trying to touch the trees",
    yearLabel: "2023",
    authorship: "own_work",
    channel: "personal_site",
    url: "https://www.bindivora.co.uk/works/trying-to-touch-the-trees-2023/",
    pageTitle: "Trying to touch the trees (2023)",
    excerpt: TREES,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [
      { key: "collage", quote: "conjunctive collages" },
      { key: "nature_and_walk", quote: "connection to nature" },
      { key: "grid", quote: "The grid roots conversations of difference" },
      { key: "coloured_shapes", quote: "coloured shapes" },
      { key: "found_or_archival_image", quote: "fragments of found postcards and images" },
    ],
  },
  {
    subjectId: "paul-ninson",
    bodyKey: "village-with-no-men",
    title: "Village with No Men",
    yearLabel: "2017",
    authorship: "own_work",
    channel: "press",
    url: "https://www.worldphoto.org/blogs/25-11-18/projecting-hidden-colors-africa",
    pageTitle: "Projecting the hidden colors of Africa | World Photography Organisation",
    excerpt: VILLAGE_WPO,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [
      {
        key: "women_only_village",
        quote: "it is a village with no man living in it. These women, fleeing abuse",
      },
    ],
  },
  {
    subjectId: "paul-ninson",
    bodyKey: "village-with-no-men",
    title: "Village with No Men",
    yearLabel: "2017",
    authorship: "own_work",
    channel: "press",
    url: "https://www.cnn.com/travel/gallery/paul-ninson-photography-umoja-village-kenya-spc-intl",
    pageTitle: "Photographer Paul Ninson explores the ‘Village with No Men’ | CNN",
    excerpt: VILLAGE_CNN,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [
      {
        key: "women_only_village",
        quote: "many are survivors of gender-based violence",
      },
    ],
  },
  {
    subjectId: "paul-ninson",
    bodyKey: "feeding-ghana",
    title: "Feeding Ghana",
    yearLabel: "ongoing",
    authorship: "own_work",
    channel: "press",
    url: "https://www.worldphoto.org/blogs/25-11-18/projecting-hidden-colors-africa",
    pageTitle: "Projecting the hidden colors of Africa | World Photography Organisation",
    excerpt: FEEDING_GHANA,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [{ key: "food_labor", quote: "the front lines who work to feed the country" }],
  },
  {
    subjectId: "paul-ninson",
    bodyKey: "where-education-is-free",
    title: "Where education is free - Ghana",
    yearLabel: null,
    authorship: "own_work",
    channel: "personal_site",
    url: "https://www.paulninson.com/where-education-is-free-ghana",
    pageTitle: "Where education is free -Ghana — Paul Ninson",
    excerpt: null,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [],
  },
  {
    subjectId: "paul-ninson",
    bodyKey: "hene",
    title: "Gallery 2",
    yearLabel: null,
    authorship: "own_work",
    channel: "personal_site",
    url: "https://www.paulninson.com/hene",
    pageTitle: "Gallery 2 — Paul Ninson",
    excerpt: null,
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [],
  },
  {
    subjectId: "monica-allende",
    bodyKey: "zed-nelson-anthropocene",
    title: "The Anthropocene Illusion",
    yearLabel: "2025",
    authorship: "judged_or_commented",
    channel: "press",
    url: "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced",
    pageTitle: "SONY WORLD PHOTOGRAPHY AWARDS: OVERALL WINNERS 2025 ANNOUNCED",
    excerpt:
      "The jury applauded Nelson’s urgent topic and his ability to translate complex environmental issues into striking visual narratives.",
    imageCount: null,
    imageCountNote: NO_COUNT,
    claims: [],
  },
];

export const PORTFOLIO_LEADS: FixtureLead[] = [
  {
    subjectId: "bindi-vora",
    channel: "personal_site",
    url: "https://www.bindivora.co.uk/works/",
    note: "个人网站作品索引还列出其他标题。没有摘录说明的标题不计为样本组，也不从标题推断风格。",
  },
  {
    subjectId: "paul-ninson",
    channel: "personal_site",
    url: "https://www.paulninson.com/about-1",
    note: "关于页是履历。履历里提到的拍摄对象不转成样本组，也不生成风格。",
  },
];
