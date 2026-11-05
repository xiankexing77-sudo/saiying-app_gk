import { analyzePhotograph, analyzeSeriesWork } from "../../../agents/text-evidence";
import { generateStyleTags } from "../../../agents/style-tags";
import { acquirePersonalWorks, portfoliosFrom } from "../../../collectors/portfolio/collect";
import { EXTRACTION_VERSION, PARSER_VERSION, provenance, SEED_FETCHED_AT, sources, TRACK_MAPPING_VERSION } from "./sources";
import type {
  Award,
  AwardLink,
  Category,
  Database,
  EditionCategory,
  ImageAsset,
  Jury,
  JuryAssignment,
  JuryFactProfile,
  NormalizedTrack,
  Photographer,
  Photograph,
  PublicQuote,
  Series,
  SeriesImage,
  Track,
  WorkForm,
} from "./types";

const RIGHTS_NOTE =
  "权限阻塞：未确认可再发布原图。只保存官方页面 URL，不抓取、不托管图像二进制，页面使用占位，不外链显示原图。";

type Person = {
  id: string;
  name: string;
  country: string | null;
  nameNote?: string | null;
  sourceId: string;
};

type Frame = { title: string; description: string };

type Winner = {
  id: string;
  year: 2025 | 2026;
  track: NormalizedTrack;
  rawCategory: string;
  title: string | null;
  people: Person[];
  description: string | null;
  sourceId: string;
  pageUrl: string;
  awards: Array<"category" | "overall">;
  form: WorkForm;
  frames?: Frame[];
  quotes?: PublicQuote[];
};

const professionalCategories = [
  "Architecture & Design",
  "Creative",
  "Documentary Projects",
  "Environment",
  "Landscape",
  "Perspectives",
  "Portraiture",
  "Sport",
  "Still Life",
  "Wildlife & Nature",
];

const openCategories = [
  "Architecture",
  "Creative",
  "Landscape",
  "Lifestyle",
  "Motion",
  "Natural World & Wildlife",
  "Object",
  "Portraiture",
  "Street Photography",
  "Travel",
];

const zedQuote: PublicQuote = {
  speaker: "Monica Allende",
  role: "Chair of the 2025 Professional jury",
  text: "The jury applauded Nelson’s urgent topic and his ability to translate complex environmental issues into striking visual narratives. The Anthropocene Illusion illustrates a world where the boundaries between the real and the artificial blur, where the wild survives in controlled enclosures, and where human nostalgia for nature is expressed through spectacle rather than action. Nelson’s work compels viewers to question their own role in this paradox and consider the consequences of a society increasingly distanced from the natural world. This timely body of work tells one of the most important stories of our age, and is now more critical than ever.",
  boundary: "引语写的是评委会的集体表述，不是评委个人投票或选择记录。",
  provenance: provenance("src-press-uk-2025"),
};

const winners: Winner[] = [
  w("series-2025-architecture-design", 2025, "series", "Architecture & Design", "The Tokyo Toilet Project", [p("ulana-switucha", "Ulana Switucha", "Canada", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-creative", 2025, "series", "Creative", "Rhi-Entry", [p("rhiannon-adam", "Rhiannon Adam", "United Kingdom", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-documentary", 2025, "series", "Documentary Projects", "Divided Youth of Belfast", [p("toby-binder", "Toby Binder", "Germany", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-environment", 2025, "series", "Environment", "Alquimia Textil", [p("nicolas-garrido-huguet", "Nicolás Garrido Huguet", "Peru", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-landscape", 2025, "series", "Landscape", "The Strata of Time", [p("seido-kino", "Seido Kino", "Japan", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-perspectives", 2025, "series", "Perspectives", "The Journey Home from School", [p("laura-pannack", "Laura Pannack", "United Kingdom", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-portraiture", 2025, "series", "Portraiture", "M’kumba", [p("gui-christ", "Gui Christ", "Brazil", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-sport", 2025, "series", "Sport", "Shred the Patriarchy", [p("chantal-pinzi", "Chantal Pinzi", "Italy", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w("series-2025-still-life", 2025, "series", "Still Life", "Still Waiting", [p("peter-franck", "Peter Franck", "Germany", "src-press-uk-2025")], null, "src-press-uk-2025", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", ["category"], "series"),
  w(
    "series-2025-wildlife",
    2025,
    "series",
    "Wildlife & Nature",
    "The Anthropocene Illusion",
    [p("zed-nelson", "Zed Nelson", "United Kingdom", "src-press-uk-2025")],
    "Over six years, and across four continents, Zed Nelson has explored how we immerse ourselves in increasingly choreographed and simulated environments to mask our destructive impact on the natural world.",
    "src-overall-2025",
    "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025",
    ["category", "overall"],
    "series",
    undefined,
    [zedQuote],
  ),
  w("single-2025-architecture", 2025, "single_image", "Architecture", "Center of the Cosmos", [p("xuecheng-liu", "Xuecheng Liu", "China Mainland", "src-blog-open-2025")], "Center of the Cosmos shows New York’s iconic Times Square from above, using a very wide angle to highlight the expanse of the city.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-creative", 2025, "single_image", "Creative", "Kem the Unstoppable", [p("jonell-francisco", "Jonell Francisco", "Philippines", "src-blog-open-2025")], "Kem the Unstoppable is an elegantly photographed collage portrait, alluding to Renaissance traditions of portraiture.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-landscape", 2025, "single_image", "Landscape", null, [p("ng-guang-ze", "Ng Guang Ze", "Singapore", "src-blog-open-2025")], "A mesmerising black-and-white shot of a stream meandering through grasslands into a lake in the distance, taken in Wenhai, Lijiang.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-lifestyle", 2025, "single_image", "Lifestyle", null, [p("hajime-hirano", "Hajime Hirano", "Japan", "src-blog-open-2025")], "A meticulously composed image of a street vendor selling electronic parts in Akihabara, once Japan's largest electronics town following a period of rapid economic growth in the late 1950s.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-motion", 2025, "single_image", "Motion", "Tbourida La Chute", [p("olivier-unia", "Olivier Unia", "France", "src-overall-2025")], "Many of the photographs taken during a traditional Moroccan ‘tbourida’ show the riders firing their rifles. With this image, the photographer wanted to share another side of the event, and show how dangerous it can be when a rider is thrown from their mount.", "src-gallery-motion-2025", "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/open/motion", ["category", "overall"], "single"),
  w("single-2025-wildlife", 2025, "single_image", "Natural World & Wildlife", "The Whale Raft", [p("estebane-rezkallah", "Estebane Rezkallah", "France", "src-blog-open-2025")], "The Whale Raft depicts a group of polar bears feasting on the carcass of a whale in east Greenland.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-object", 2025, "single_image", "Object", "Octopuses in the Sky", [p("sussi-charlotte-alminde", "Sussi Charlotte Alminde", "Denmark", "src-blog-open-2025")], "Octopuses in the Sky, showcasing elaborate handmade kites at the Fanø International Kite Fliers Meeting, one of the world’s largest kite flying events.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-portraiture", 2025, "single_image", "Portraiture", "Encounter", [p("yeintze-boutamba", "Yeintze Boutamba", "Gabon", "src-blog-open-2025")], "Encounter is a tender portrait of two people shot in the intimacy of a bedroom. The photographer wanted to immortalise this moment for the sitters.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-street", 2025, "single_image", "Street Photography", "Celebrating Football Club Victories", [p("khairizal-maris", "Khairizal Maris", "Indonesia", "src-blog-open-2025")], "Celebrating Football Club Victories pictures the elation of fans celebrating a win by their local football club by lighting flares in Bandung, West Java.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w("single-2025-travel", 2025, "single_image", "Travel", "Ask a Shaman", [p("matjaz-simic", "Matjaž Šimic", "Slovenia", "src-blog-open-2025")], "Ask a Shaman depicts a group of shamans in La Paz, Bolivia, where they play a major role in Native Bolivian traditional culture, shot against the brightly painted local architecture.", "src-blog-open-2025", "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look", ["category"], "single"),
  w(
    "series-2025-student",
    2025,
    "student",
    "Student competition",
    "The Last Day We Saw the Mountains and the Sea",
    [p("micaela-valdivia-medina", "Micaela Valdivia Medina", "Peru", "src-press-uk-2025", "就读 Instituto Profesional Arcos（Chile）。总冠军页标题行把作者名嵌进标题，这里采用新闻稿分开的作品名与作者名。")],
    "This project explores the complexity of female prison spaces and the people who inhabit them, from the inmates to their families. The series consists of photographs of the architecture of the prisons, the neighbourhoods they are in, and the dynamics at the visitor and family member entrances.",
    "src-overall-2025",
    "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025",
    ["overall"],
    "series",
  ),
  w(
    "single-2025-youth",
    2025,
    "youth",
    "Youth competition",
    "Eclipse of Motion",
    [p("daniel-dian-ji-wu", "Daniel Dian-Ji Wu", "Taiwan", "src-overall-2025", "获奖报道称当时 16 岁。")],
    "Dian Ji Wu took this photo during summer break in 2024, at Venice Beach Skatepark in LA during golden hour. The photographer captured this image of a skater mid-air, silhouetted against the sunset, expressing the raw energy of that moment.",
    "src-overall-2025",
    "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025",
    ["overall"],
    "single",
  ),
  w("series-2026-architecture-design", 2026, "series", "Architecture & Design", "Homes of Haor", [p("joy-saha", "Joy Saha", "Bangladesh", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w(
    "series-2026-creative",
    2026,
    "series",
    "Creative",
    "Bilha, Stories of my Sisters",
    [p("citlali-fabian", "Citlali Fabián", "Mexico", "src-blog-overall-2026", "新闻稿称来自墨西哥 Yalalteca 社群、现居英国。画廊版权行写作 United Kingdom，与新闻稿国别表述不完全相同，故国别采用新闻稿，不把版权行改写成第二套事实。作品页标题大小写为 Stories of my Sisters；部分新闻稿写作 Stories of My Sisters。")],
    "Growing up without role models can make it difficult to dream or recognise one’s ability to shape the future. This photographic series seeks to create a precedent through collaboration with activists and artists from various Indigenous communities in southern Mexico, particularly from Oaxaca state.",
    "src-gallery-bilha",
    "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/professional/bilha-stories-my-sisters-citlali",
    ["category", "overall"],
    "series",
    [
      ["Yasnaya Elena Aguilar", "Yasnaya is an Ayuujk linguist, writer and activist who advocates for language diversity and indigenous rights. Here, Yasnaya is represented with her grandma and great grandma, the pillars of her education and her guides to seeing the world."],
      ["Malena Rios", "Malena is a saxophonist, feminist and women's rights defender, originally from Santo Domingo Tonala, Oaxaca. She became the face against women's violence after suffering an acid attack and her campaigns promoted a law to protect women from this type of attack."],
      ["Elvira Ayuuk", "Originally from Santa Maria Alotepec, Oaxaca, Elvira is a human rights defender and lawyer. She collaborates with Amnesty International Mexico and participates in UN events, such as the Permanent Forum of Indigenous Issues and the Commission on the Status of Women."],
      ["Luna Maran", "Luna is a Zapotec filmmaker, educator and activist. Her latest film, Chicharras (Cicadas) was co-created and co-produced with her community, and narrates the defence of indigenous territory, communal organisation and women's political participation."],
      ["Nayelli Lopez Reyes", "Nayelli is a triqui weaver, podcaster, and women's rights activist. In her podcast, Güií Chanáa, she spoke with women from her community, criticising the patriarchal practices they are forced to follow."],
      ["Maestra Lety Gallardo", "Lety Gallardo is a musician, director and founder of the first regional women's band, Mujeres del Viento Florido. Through her work she has become a girls' rights defender, promoting inclusion in a male-dominated field."],
      ["Edith Morales", "Edith Morales is a visual artist, territory and water defender, and seed guardian. Here, Edith is represented with a milpa (a pre-Hispanic agricultural system) and a corn plant, surrounded by the concepts that have guided her work and life."],
      ["Mitzy Violeta Cortez", "Mitzy is part of Indigenous Futures, a network that discusses the climate crisis from the perspective of Indigenous peoples. She has participated in forums including COP26 and COP30."],
    ].map(([title, description]) => ({ title, description })),
  ),
  w("series-2026-documentary", 2026, "series", "Documentary Projects", "Under the Shadow of Coca", [p("santiago-mesa", "Santiago Mesa", "Colombia", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-environment", 2026, "series", "Environment", "Notes on How to Build a Forest", [p("isadora-romero", "Isadora Romero", "Ecuador", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-landscape", 2026, "series", "Landscape", "Constructed Landscapes", [p("dafna-talmor", "Dafna Talmor", "United Kingdom", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-perspectives", 2026, "series", "Perspectives", "Sunny Side Up: A Portrait of the Most Average K-Parenting Today", [p("seungho-kim", "Seungho Kim", "Republic of Korea", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-portraiture", 2026, "series", "Portraiture", "The Faithful", [p("jean-marc-caimi", "Jean-Marc Caimi", "Italy", "src-blog-overall-2026"), p("valentina-piccinni", "Valentina Piccinni", "Italy", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-sport", 2026, "series", "Sport", "Buzkashi", [p("todd-antony", "Todd Antony", "New Zealand", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-still-life", 2026, "series", "Still Life", "Talking Without Speaking", [p("vilma-taubo", "Vilma Taubo", "Norway", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("series-2026-wildlife", 2026, "series", "Wildlife & Nature", "Crossing Point", [p("will-burrard-lucas", "Will Burrard-Lucas", "United Kingdom", "src-blog-overall-2026")], null, "src-blog-overall-2026", "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced", ["category"], "series"),
  w("single-2026-architecture", 2026, "single_image", "Architecture", "Industrial Layers", [p("markus-naarttijarvi", "Markus Naarttijärvi", "Sweden", "src-blog-open-2026")], "Industrial Layers captures a paper mill in Obbola, Sweden on a dark November night, revealing layers of shadows, concrete, clouds and sky.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w("single-2026-creative", 2026, "single_image", "Creative", "Lost Hope", [p("siavosh-eljali", "Siavosh Eljali", "Iran, Islamic Republic Of", "src-blog-open-2026", "主办方博客拼写作 Siavosh Eljali。Sony 新闻稿表格另见 Siavosh Ejlali。两处拼写都保留，不自动合并成一个未核验姓名。")], "Lost Hope is a carefully composed portrait, using staged and symbolic elements in a poignant ode to Iranian women.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w("single-2026-landscape", 2026, "single_image", "Landscape", "Shapes and Patterns of the Desert", [p("j-fritz-rumpf", "J Fritz Rumpf", "United States", "src-blog-open-2026")], "Shapes and Patterns of the Desert shows the Sossusvlei dunes in Namibia under an early morning glow, utilising the shadows and layers to create a geometric landscape.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w("single-2026-lifestyle", 2026, "single_image", "Lifestyle", null, [p("vanta-coda-iii", "Vanta Coda III", "United States", "src-blog-open-2026")], "Vanta Coda III documents the moment a young girl Charlotte, and her cow Dolly, keeps cool between events of the 100th State Fair of West Virginia in Lewisburg.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w("single-2026-motion", 2026, "single_image", "Motion", null, [p("franklin-littlefield", "Franklin Littlefield", "United States", "src-blog-open-2026")], "Franklin Littlefield’s energy-packed image depicts a punk show in Providence, Rhode Island, featuring the band Sailboat.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w("single-2026-wildlife", 2026, "single_image", "Natural World & Wildlife", "Arctic Fox in Blizzard", [p("klaus-hellmich", "Klaus Hellmich", "Germany", "src-gallery-wildlife-2026")], "A blue arctic fox in a blizzard, photographed on the Varanger Peninsula, Norway.", "src-gallery-wildlife-2026", "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/open/natural-world-wildlife", ["category"], "single"),
  w("single-2026-object", 2026, "single_image", "Object", "Colour Divides", [p("robby-ogilvie", "Robby Ogilvie", "United Kingdom", "src-gallery-object-2026")], "Taken in the Bo-Kaap neighbourhood of Cape Town, South Africa, this image centres on a parked car set against a sharply divided colourful facade.", "src-gallery-object-2026", "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/open/object", ["category"], "single"),
  w("single-2026-portraiture", 2026, "single_image", "Portraiture", "The Barefoot Volcanologist", [p("elle-leontiev", "Elle Leontiev", "Australia", "src-press-my-2026")], "Elle Leontiev wins for The Barefoot Volcanologist, a striking portrait of Phillip Yamah, an internationally recognised, self-taught volcano scientist, standing atop a volcanic rock bomb on the island of Tanna, Vanuatu.", "src-press-my-2026", "https://www.sony.com.my/pressrelease?prName=overall-winners-2026", ["category", "overall"], "single"),
  w("single-2026-street", 2026, "single_image", "Street Photography", null, [p("giulia-pissagroia", "Giulia Pissagroia", "Italy", "src-blog-open-2026")], "Giulia Pissagroia captures the distinct expressions of a family admiring the view from Ørnevegen (Eagle Road), Norway.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w("single-2026-travel", 2026, "single_image", "Travel", null, [p("megumi-murakami", "Megumi Murakami", "Japan", "src-blog-open-2026")], "Megumi Murakami photographs a dynamic finale of the Abare Festival, showing men leaping into the river amidst fiercely burning torches.", "src-blog-open-2026", "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced", ["category"], "single"),
  w(
    "series-2026-student",
    2026,
    "student",
    "Student competition",
    "The Place Where I Used to Play",
    [p("jubair-ahmed-arnob", "Jubair Ahmed Arnob", "Bangladesh", "src-press-my-2026", "就读 Counter Foto – A Center for Visual Arts。")],
    "In his series The Place Where I Used To Play, Arnob returns to Green Model Town in Dhaka. Through a dreamy, poetic style, Jubair photographs its vibrant community and tranquil landscape, now disappearing under concrete.",
    "src-blog-overall-2026",
    "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced",
    ["overall"],
    "series",
  ),
  w(
    "single-2026-youth",
    2026,
    "youth",
    "Youth competition",
    "Saving History from the Flames",
    [p("philip-kangas", "Philip Kangas", "Sweden", "src-blog-overall-2026", "典礼报道称 16 岁；新闻稿人物简介称 17 岁。年龄不合并为单一事实。")],
    "Kangas captured a moment showing firefighters transporting art pieces to safety, following a fire at the Royal Academy of Fine Arts in central Stockholm.",
    "src-blog-overall-2026",
    "https://www.worldphoto.org/blogs/16-04-26/sony-world-photography-awards-2026-overall-winners-announced",
    ["overall"],
    "single",
  ),
];

function p(id: string, name: string, country: string, sourceId: string, nameNote: string | null = null): Person {
  return { id, name, country, sourceId, nameNote };
}

function w(
  id: string,
  year: 2025 | 2026,
  track: NormalizedTrack,
  rawCategory: string,
  title: string | null,
  people: Person[],
  description: string | null,
  sourceId: string,
  pageUrl: string,
  awards: Array<"category" | "overall">,
  form: WorkForm,
  frames?: Frame[],
  quotes?: PublicQuote[],
): Winner {
  return { id, year, track, rawCategory, title, people, description, sourceId, pageUrl, awards, form, frames, quotes };
}

const categoryKey = (track: NormalizedTrack, rawName: string) =>
  `cat-${track}-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

function buildCategories(): Category[] {
  const rows: Category[] = [];
  for (const rawName of professionalCategories) {
    rows.push(category("series", rawName, "src-press-uk-2025"));
  }
  for (const rawName of openCategories) {
    rows.push(category("single_image", rawName, "src-blog-open-2025"));
  }
  rows.push(category("student", "Student competition", "src-press-uk-2025"));
  rows.push(category("youth", "Youth competition", "src-press-uk-2025"));
  return rows;
}

function category(track: NormalizedTrack, rawName: string, sourceId: string): Category {
  return {
    id: categoryKey(track, rawName),
    competitionId: "swpa",
    normalizedTrack: track,
    rawName,
    normalizedName: rawName,
    mappingVersion: TRACK_MAPPING_VERSION,
    provenance: provenance(sourceId),
  };
}

const overallAwardName: Record<NormalizedTrack, string> = {
  series: "Photographer of the Year",
  single_image: "Open Photographer of the Year",
  student: "Student Photographer of the Year",
  youth: "Youth Photographer of the Year",
};

type JuryInput = {
  id: string;
  name: string;
  sourceId: string;
  assignments: Array<{
    editionYear: 2025 | 2026;
    tracks: NormalizedTrack[];
    roleTitle: string;
    institution: string | null;
    biographyExcerpt: string | null;
    profileSourceId: string;
  }>;
};

const juryInputs: JuryInput[] = [
  {
    id: "monica-allende",
    name: "Monica Allende",
    sourceId: "src-judges-2025",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["series"],
        roleTitle: "Independent Curator, Photography Consultant and Chair of the Jury",
        institution: null,
        biographyExcerpt:
          "Monica Allende is an independent curator, artistic director, consultant and educator. She previously served as Photo Editor at the Sunday Times Magazine, Artistic Director of the Landskrona Foto Festival, GetxoPhoto International Image Festival Artistic Director, FORMAT17 International Photography Festival director and she curated Light at Peckham24 in 2021.",
        profileSourceId: "src-judges-2025",
      },
      {
        editionYear: 2026,
        tracks: ["series"],
        roleTitle: "Independent Curator and Photography Consultant, Chair of the Jury",
        institution: null,
        biographyExcerpt: null,
        profileSourceId: "src-judges-2026",
      },
    ],
  },
  {
    id: "yves-chatap",
    name: "Yves Chatap",
    sourceId: "src-judges-2025",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["series"],
        roleTitle: "Curator, Art Critic and Publisher",
        institution: null,
        biographyExcerpt:
          "Yves Chatap is a curator, art critic and publisher whose practice centres on exploring the intersections between intimacy, identity, and photography. He is the co-founder of YCOS-Project, an initiative dedicated to supporting artists.",
        profileSourceId: "src-judges-2025",
      },
    ],
  },
  {
    id: "aldeide-delgado",
    name: "Aldeide Delgado",
    sourceId: "src-press-eu-2025-jury",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["series"],
        roleTitle: "Founder and Director, Women Photographers International Archive (WOPHA)",
        institution: "Women Photographers International Archive (WOPHA)",
        biographyExcerpt: null,
        profileSourceId: "src-press-eu-2025-jury",
      },
    ],
  },
  {
    id: "vicky-ismach",
    name: "Vicky Ismach",
    sourceId: "src-press-eu-2025-jury",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["series"],
        roleTitle: "Curatorial Coordinator, Montevideo Center of Photography (CdF)",
        institution: "Montevideo Center of Photography (CdF)",
        biographyExcerpt: null,
        profileSourceId: "src-press-eu-2025-jury",
      },
    ],
  },
  {
    id: "manuel-sigrist",
    name: "Manuel Sigrist",
    sourceId: "src-press-eu-2025-jury",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["series"],
        roleTitle: "Head of Exhibitions and Programmes, Photo Elysée",
        institution: "Photo Elysée",
        biographyExcerpt: null,
        profileSourceId: "src-press-eu-2025-jury",
      },
    ],
  },
  {
    id: "isabella-tam",
    name: "Isabella Tam",
    sourceId: "src-press-eu-2025-jury",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["series"],
        roleTitle: "Curator of Visual Art, M+",
        institution: "M+",
        biographyExcerpt: null,
        profileSourceId: "src-press-eu-2025-jury",
      },
    ],
  },
  {
    id: "claudia-grimaldi-marks",
    name: "Claudia Grimaldi Marks",
    sourceId: "src-judges-2025",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["single_image", "youth"],
        roleTitle: "Senior Manager, New Creator Strategy, Getty Images",
        institution: "Getty Images",
        biographyExcerpt:
          "Claudia Grimaldi Marks is a New York City-based photography and creative director with over 30 years' experience in publishing and image making. Currently the Senior Manager of New Creator Strategy at Getty Images.",
        profileSourceId: "src-judges-2025",
      },
    ],
  },
  {
    id: "charlotte-jansen",
    name: "Charlotte Jansen",
    sourceId: "src-press-eu-2025-jury",
    assignments: [
      {
        editionYear: 2025,
        tracks: ["student"],
        roleTitle: "Author, Journalist and Critic",
        institution: null,
        biographyExcerpt: null,
        profileSourceId: "src-press-eu-2025-jury",
      },
    ],
  },
  {
    id: "daniel-brena",
    name: "Daniel Brena",
    sourceId: "src-blog-judges-2026",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["series"],
        roleTitle: "Director, Centro de las Artes de San Agustín",
        institution: "Centro de las Artes de San Agustín",
        biographyExcerpt:
          "Daniel Brena is a curator and director based in Oaxaca, Mexico. He leads the Centro de las Artes de San Agustín (CaSa) and previously directed the Centro Fotográfico Manuel Álvarez Bravo.",
        profileSourceId: "src-blog-judges-2026",
      },
    ],
  },
  {
    id: "yumi-goto",
    name: "Yumi Goto",
    sourceId: "src-blog-judges-2026",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["series"],
        roleTitle: "Independent Curator, Editor, Researcher and Publisher",
        institution: null,
        biographyExcerpt:
          "Yumi Goto is an independent curator, editor, researcher, and publisher based in Japan. She works extensively with emerging and established photographers, collaborating on long-term documentary projects.",
        profileSourceId: "src-blog-judges-2026",
      },
    ],
  },
  {
    id: "zack-hatfield",
    name: "Zack Hatfield",
    sourceId: "src-blog-judges-2026",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["series"],
        roleTitle: "Managing Editor, Aperture magazine",
        institution: "Aperture",
        biographyExcerpt:
          "Zack Hatfield is the managing editor of Aperture magazine. He worked previously as a senior editor of Artforum.",
        profileSourceId: "src-blog-judges-2026",
      },
    ],
  },
  {
    id: "paul-ninson",
    name: "Paul Ninson",
    sourceId: "src-press-eu-2026-jury",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["series"],
        roleTitle: "Founder and Executive Director, Dikan Center",
        institution: "Dikan Center",
        biographyExcerpt: null,
        profileSourceId: "src-press-eu-2026-jury",
      },
    ],
  },
  {
    id: "bindi-vora",
    name: "Bindi Vora",
    sourceId: "src-blog-judges-2026",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["series"],
        roleTitle: "Artist and Senior Curator, Autograph",
        institution: "Autograph",
        biographyExcerpt:
          "Bindi Vora is an interdisciplinary artist of Kenyan Indian heritage and senior curator at Autograph, London.",
        profileSourceId: "src-blog-judges-2026",
      },
    ],
  },
  {
    id: "ruby-rees-sheridan",
    name: "Ruby Rees-Sheridan",
    sourceId: "src-judges-2026",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["single_image", "youth"],
        roleTitle: "Assistant Curator, Photography, National Portrait Gallery",
        institution: "National Portrait Gallery",
        biographyExcerpt: null,
        profileSourceId: "src-judges-2026",
      },
    ],
  },
  {
    id: "tess-raimbeau",
    name: "Tess Raimbeau",
    sourceId: "src-blog-judges-2026",
    assignments: [
      {
        editionYear: 2026,
        tracks: ["student"],
        roleTitle: "Photo Editor, Libération",
        institution: "Libération",
        biographyExcerpt:
          "Tess Raimbeau started working as a Photo Editor at Libération in 2015 and is now responsible for the international pages.",
        profileSourceId: "src-blog-judges-2026",
      },
    ],
  },
];

function asset(id: string): ImageAsset {
  return {
    id,
    officialImageUrl: null,
    rightsStatus: "rights_blocked",
    rightsNote: RIGHTS_NOTE,
    hostedBinary: false,
  };
}

export function buildDatabase(): Database {
  const categories = buildCategories();
  const categoryByKey = new Map(categories.map((item) => [`${item.normalizedTrack}:${item.rawName}`, item]));
  const photographers = new Map<string, Photographer>();
  const imageAssets: ImageAsset[] = [];
  const photographs: Photograph[] = [];
  const series: Series[] = [];
  const seriesImages: SeriesImage[] = [];
  const awardLinks: AwardLink[] = [];

  const awards: Award[] = [];
  for (const year of [2025, 2026] as const) {
    for (const track of ["series", "single_image", "student", "youth"] as const) {
      const sourceId = year === 2025 ? "src-press-uk-2025" : "src-blog-overall-2026";
      awards.push({
        id: `award-${year}-${track}-overall`,
        editionId: `swpa-${year}`,
        normalizedTrack: track,
        name: overallAwardName[track],
        scope: "overall",
        rank: 1,
        provenance: provenance(sourceId),
      });
      if (track === "series" || track === "single_image") {
        awards.push({
          id: `award-${year}-${track}-category`,
          editionId: `swpa-${year}`,
          normalizedTrack: track,
          name: "Category Winner",
          scope: "category",
          rank: 1,
          provenance: provenance(sourceId),
        });
      }
    }
  }

  for (const winner of winners) {
    const category = categoryByKey.get(`${winner.track}:${winner.rawCategory}`);
    if (!category) {
      throw new Error(`Missing category ${winner.track}:${winner.rawCategory}`);
    }
    for (const person of winner.people) {
      if (!photographers.has(person.id)) {
        photographers.set(person.id, {
          id: person.id,
          name: person.name,
          country: person.country,
          nameNote: person.nameNote ?? null,
          provenance: provenance(person.sourceId),
        });
      }
    }
    const peopleIds = winner.people.map((person) => person.id);
    const coverId = `asset-${winner.id}`;
    imageAssets.push(asset(coverId));
    if (winner.form === "series") {
      series.push({
        id: winner.id,
        editionId: `swpa-${winner.year}`,
        photographerIds: peopleIds,
        title: winner.title,
        description: winner.description,
        categoryId: category.id,
        officialSourceUrl: winner.pageUrl,
        imageCount: winner.frames?.length ?? null,
        imageCountNote: winner.frames
          ? "张数等于已核对该作品页上的画幅说明条数。"
          : "系列张数未从官网逐帧采集，不填估计值。",
        imageAssetId: coverId,
        provenance: provenance(winner.sourceId),
        publicQuotes: winner.quotes ?? [],
      });
      winner.frames?.forEach((frame, index) => {
        const photoId = `${winner.id}-frame-${index + 1}`;
        const frameAsset = `asset-${photoId}`;
        imageAssets.push(asset(frameAsset));
        photographs.push({
          id: photoId,
          title: frame.title,
          photographerIds: peopleIds,
          editionId: `swpa-${winner.year}`,
          categoryId: category.id,
          description: frame.description,
          officialPageUrl: winner.pageUrl,
          imageAssetId: frameAsset,
          role: "series_frame",
          provenance: provenance(winner.sourceId),
        });
        seriesImages.push({
          id: `link-${photoId}`,
          seriesId: winner.id,
          photographId: photoId,
          sequenceNumber: index + 1,
        });
      });
    } else {
      photographs.push({
        id: winner.id,
        title: winner.title,
        photographerIds: peopleIds,
        editionId: `swpa-${winner.year}`,
        categoryId: category.id,
        description: winner.description,
        officialPageUrl: winner.pageUrl,
        imageAssetId: coverId,
        role: "standalone",
        provenance: provenance(winner.sourceId),
      });
    }
    for (const scope of winner.awards) {
      const awardId =
        scope === "overall" ? `award-${winner.year}-${winner.track}-overall` : `award-${winner.year}-${winner.track}-category`;
      awardLinks.push({
        id: `link-${winner.id}-${scope}`,
        awardId,
        seriesId: winner.form === "series" ? winner.id : null,
        photographId: winner.form === "single" ? winner.id : null,
        photographerIds: peopleIds,
        provenance: provenance(winner.sourceId),
      });
    }
  }

  const juries: Jury[] = juryInputs.map((jury) => ({
    id: jury.id,
    name: jury.name,
    provenance: provenance(jury.sourceId),
  }));
  const juryAssignments: JuryAssignment[] = juryInputs.flatMap((jury) =>
    jury.assignments.map((assignment) => ({
      id: `${jury.id}-${assignment.editionYear}`,
      juryId: jury.id,
      editionId: `swpa-${assignment.editionYear}`,
      tracks: assignment.tracks,
      roleTitle: assignment.roleTitle,
      institution: assignment.institution,
      biographyExcerpt: assignment.biographyExcerpt,
      officialProfileUrl:
        assignment.editionYear === 2025
          ? "https://www.worldphoto.org/sony-world-photography-awards/2025-judges"
          : "https://www.worldphoto.org/2026-judges",
      provenance: provenance(assignment.profileSourceId),
    })),
  );
  const juryFacts: JuryFactProfile[] = juryInputs.map((jury) => ({
    juryId: jury.id,
    kind: "fact" as const,
    education: null,
    publications: [],
    interviews: [],
  }));
  const personalWorks = acquirePersonalWorks(
    juryInputs.map((jury) => ({
      id: jury.id,
      name: jury.name,
      officialProfileUrls: [
        ...new Set(
          jury.assignments.map((assignment) =>
            assignment.editionYear === 2025
              ? "https://www.worldphoto.org/sony-world-photography-awards/2025-judges"
              : "https://www.worldphoto.org/2026-judges",
          ),
        ),
      ],
    })),
  );
  const juryInferences = personalWorks.map((acquisition) =>
    generateStyleTags({
      subjectId: acquisition.subjectId,
      groups: acquisition.groups,
      analyzedAt: SEED_FETCHED_AT,
    }),
  );

  const tracks: Track[] = ([2025, 2026] as const).flatMap((year) => {
    const sourceId = year === 2025 ? "src-press-uk-2025" : "src-blog-overall-2026";
    const defs: Array<[NormalizedTrack, string, string, WorkForm]> = [
      ["series", "Professional competition", "Series", "series"],
      ["single_image", "Open competition", "Single Image", "single"],
      ["student", "Student competition", "Student", "series"],
      ["youth", "Youth competition", "Youth", "single"],
    ];
    return defs.map(([normalizedTrack, rawName, normalizedLabel, workForm]) => ({
      id: `track-${year}-${normalizedTrack}`,
      editionId: `swpa-${year}`,
      rawName,
      normalizedTrack,
      normalizedLabel,
      mappingVersion: TRACK_MAPPING_VERSION,
      workForm,
      provenance: provenance(sourceId),
    }));
  });

  const editionCategories: EditionCategory[] = ([2025, 2026] as const).flatMap((year) =>
    categories.map((category) => ({
      id: `ec-${year}-${category.id}`,
      editionId: `swpa-${year}`,
      categoryId: category.id,
      brief:
        category.normalizedTrack === "student"
          ? year === 2025
            ? "In the Beginning"
            : "Together"
          : null,
      note:
        category.normalizedTrack === "youth"
          ? "面向 19 岁及以下的 Open Call，征集过去一年的照片。不是与 Professional 类别同名的子项。"
          : category.normalizedTrack === "student"
            ? "学生组按当年命题提交系列，不按 Professional 的十个类别拆分。"
            : null,
      provenance: provenance(year === 2025 ? "src-press-uk-2025" : "src-press-my-2026"),
    })),
  );

  return {
    competition: {
      id: "swpa",
      name: "Sony World Photography Awards",
      nameZh: "索尼世界摄影大赛",
      organizer: "World Photography Organisation（Creo），Sony 为合作方",
      homepageUrl: "https://www.worldphoto.org/sony-world-photography-awards",
      provenance: provenance("src-home"),
    },
    editions: [
      {
        id: "swpa-2025",
        competitionId: "swpa",
        year: 2025,
        editionNumber: 18,
        officialLabel: "Sony World Photography Awards 2025",
        winnersComplete: true,
        submissionNote: "Open 公布稿称本届收到超过 419,000 张、来自 200 多个国家和地区的图像。这是公布稿中的数字，不是本库重新统计。",
        provenance: provenance("src-blog-open-2025"),
      },
      {
        id: "swpa-2026",
        competitionId: "swpa",
        year: 2026,
        editionNumber: 19,
        officialLabel: "Sony World Photography Awards 2026",
        winnersComplete: true,
        submissionNote: "Open 公布稿称本届收到超过 430,000 张、来自 200 多个国家和地区的图像。这是公布稿中的数字，不是本库重新统计。",
        provenance: provenance("src-blog-open-2026"),
      },
    ],
    honors: [
      {
        id: "honor-2025-meiselas",
        editionId: "swpa-2025",
        title: "Outstanding Contribution to Photography",
        recipient: "Susan Meiselas",
        summary: "2025 年该荣誉授予 Susan Meiselas。这不是四个比赛体系中的获奖作品，不进入组别比较。",
        provenance: provenance("src-press-uk-2025"),
      },
      {
        id: "honor-2026-meyerowitz",
        editionId: "swpa-2026",
        title: "Outstanding Contribution to Photography",
        recipient: "Joel Meyerowitz",
        summary: "2026 年该荣誉授予 Joel Meyerowitz。这不是四个比赛体系中的获奖作品，不进入组别比较。",
        provenance: provenance("src-blog-overall-2026"),
      },
    ],
    tracks,
    categories,
    editionCategories,
    awards,
    photographers: [...photographers.values()],
    imageAssets,
    photographs,
    series,
    seriesImages,
    awardLinks,
    juries,
    juryAssignments,
    juryPortfolios: personalWorks.flatMap((acquisition) => portfoliosFrom(acquisition)),
    juryFacts,
    juryInferences,
    personalWorks,
    singleAnalyses: photographs.map((photo) => analyzePhotograph(photo, SEED_FETCHED_AT)),
    seriesAnalyses: series.map((item) => analyzeSeriesWork(item, SEED_FETCHED_AT)),
    tasks: [
      {
        id: "task-seed-2025",
        type: "crawl",
        title: "导入 SWPA 2025 获奖与评委种子",
        status: "succeeded",
        stage: "种子导入完成",
        total: 4,
        completed: 4,
        failed: 0,
        currentItem: null,
        errorLog: [],
        startedAt: "2026-11-03T15:00:00.000Z",
        finishedAt: "2026-11-03T15:05:00.000Z",
        idempotencyKey: "seed-swpa-2025",
        years: [2025],
        scope: null,
        stages: [{ stage: "collection", status: "passed", summary: "种子导入完成，未访问网络。" }],
      },
      {
        id: "task-seed-2026",
        type: "crawl",
        title: "导入 SWPA 2026 获奖与评委种子",
        status: "succeeded",
        stage: "种子导入完成",
        total: 4,
        completed: 4,
        failed: 0,
        currentItem: null,
        errorLog: [],
        startedAt: "2026-11-03T15:05:00.000Z",
        finishedAt: "2026-11-03T15:10:00.000Z",
        idempotencyKey: "seed-swpa-2026",
        years: [2026],
        scope: null,
        stages: [{ stage: "collection", status: "passed", summary: "种子导入完成，未访问网络。" }],
      },
      {
        id: "task-image-analysis",
        type: "analyze",
        title: "获奖作品视觉分析",
        status: "blocked",
        stage: "权限与模型检查",
        total: 44,
        completed: 0,
        failed: 44,
        currentItem: null,
        errorLog: [
          "图像权限为 rights_blocked，未保存原图。",
          "VISION_MODEL 未配置。像素分析停在这里。说明原文的词表对照另记在作品页，不代替看图。",
        ],
        startedAt: "2026-11-03T15:10:00.000Z",
        finishedAt: "2026-11-03T15:10:00.000Z",
        idempotencyKey: "analyze-swpa-2025-2026",
        years: [2025, 2026],
        scope: {
          winners: true,
          shortlists: false,
          juries: false,
          juryPortfolios: false,
          imageAnalysis: true,
          reportGeneration: false,
        },
        stages: [
          {
            stage: "image_analysis",
            status: "blocked",
            summary: "原图 rights_blocked，未配置视觉模型。",
          },
        ],
      },
      {
        id: "task-jury-research",
        type: "research",
        title: "评委本人作品与风格标签",
        status: "succeeded",
        stage: "16 位已检查；达到 3 组的才生成风格标签",
        total: 16,
        completed: 16,
        failed: 0,
        currentItem: null,
        errorLog: [],
        startedAt: "2026-11-03T15:12:00.000Z",
        finishedAt: "2026-11-03T15:12:00.000Z",
        idempotencyKey: "research-juries-swpa",
        years: [2025, 2026],
        scope: null,
        stages: [{ stage: "jury_research", status: "passed", summary: "不足 3 组的评委没有风格标签。" }],
      },
      {
        id: "task-report",
        type: "report",
        title: "2025 / 2026 同组别事实对照",
        status: "succeeded",
        stage: "事实对照已生成。像素趋势未生成。",
        total: 1,
        completed: 1,
        failed: 0,
        currentItem: null,
        errorLog: [],
        startedAt: "2026-11-03T15:20:00.000Z",
        finishedAt: "2026-11-03T15:25:00.000Z",
        idempotencyKey: "report-facts-only",
        years: [2025, 2026],
        scope: null,
        stages: [{ stage: "report", status: "passed", summary: "同赛制事实对照。没有像素趋势。" }],
      },
    ],
    sources,
  };
}

export const database = buildDatabase();

export const seedMeta = {
  parserVersion: PARSER_VERSION,
  extractionVersion: EXTRACTION_VERSION,
  mappingVersion: TRACK_MAPPING_VERSION,
};
