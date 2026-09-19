export type ArticleBlock = {
  type: "p" | "h2";
  text: string;
};

export type Article = {
  id: string;
  category: string;
  title: string;
  date: string;
  comments: string;
  likes: string;
  href?: string;
  image: {
    src: string;
    alt: string;
    objectPosition?: string;
  };
  body: ArticleBlock[];
};

const lorem = [
  "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می‌باشد.",
  "کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می‌طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه‌ای علی‌الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد.",
  "در این صورت می‌توان امید داشت که تمام و دشواری موجود در ارائه راهکارها، و شرایط سخت تایپ به پایان رسد و زمان مورد نیاز شامل حروفچینی دستاوردهای اصلی، و جوابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.",
];

const heading =
  "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ";

function articleBody(): ArticleBlock[] {
  return [
    { type: "p", text: lorem[0] },
    { type: "p", text: lorem[1] },
    { type: "p", text: lorem[2] },
    { type: "h2", text: heading },
    { type: "p", text: lorem[0] },
    { type: "p", text: lorem[1] },
    { type: "p", text: lorem[2] },
  ];
}

export const articles: Article[] = [
  {
    id: "online-trips",
    category: "مقاله",
    title: "سفرهای آنلاین چه تأثیری بر زندگی مردم گذاشته است؟",
    date: "۱ شهریور ۱۴۰۵",
    comments: "۱۰",
    likes: "۱.۵k",
    image: {
      src: "/figma/png/passenger-insideCar.jpg",
      alt: "مسافر در حال استفاده از اپلیکیشن دات‌وان تریپ",
      objectPosition: "center 18%",
    },
    body: articleBody(),
  },
  {
    id: "intercity",
    category: "اخبار",
    title: "دات‌وان تریپ سفر بین شهری را به خدمات خود اضافه کرد.",
    date: "۱ هفته پیش",
    comments: "۷",
    likes: "۸۴۰",
    image: {
      src: "/figma/png/cars-insideCabin.png",
      alt: "کابین هوشمند خودروی دات‌وان تریپ",
      objectPosition: "center 80%",
    },
    body: articleBody(),
  },
  {
    id: "city-trip-guide",
    category: "راهنما",
    title: "راهنمای درخواست سفر شهری",
    date: "۱ شهریور ۱۴۰۵",
    comments: "۵",
    likes: "۵۲۰",
    image: {
      src: "/figma/png/mobilephone.png",
      alt: "درخواست سفر شهری روی موبایل",
    },
    body: articleBody(),
  },
  {
    id: "org-guide",
    category: "راهنما",
    title: "راهنمای استفاده از خدمات سازمانی",
    date: "۵ مرداد ۱۴۰۵",
    comments: "۳",
    likes: "۳۸۰",
    image: {
      src: "/figma/png/mobilephone.png",
      alt: "استفاده از خدمات سازمانی روی موبایل",
    },
    body: articleBody(),
  },
  {
    id: "fifty-thousand",
    category: "اخبار",
    title: "آمار نشان می‌دهد که دات‌وان تریپ بیش از ۵۰ هزار سفر موفق داشته است",
    date: "۲۴ مرداد ۱۴۰۵",
    comments: "۸",
    likes: "۹۲۰",
    image: {
      src: "/figma/png/driver-backneck.png",
      alt: "راننده دات‌وان تریپ در مسیر",
    },
    body: articleBody(),
  },
  {
    id: "online-taxi",
    category: "اخبار",
    title: "دات‌وان تریپ، تجربه‌ای متفاوت از تاکسی‌های آنلاین را عرضه می‌کند",
    date: "۲۰ مرداد ۱۴۰۵",
    comments: "۶",
    likes: "۷۱۰",
    image: {
      src: "/figma/png/cars-navy.jpg",
      alt: "ناوگان دات‌وان تریپ",
    },
    body: articleBody(),
  },
  {
    id: "support-guide",
    category: "راهنما",
    title: "راهنمای ثبت درخواست پشتیبانی",
    date: "۱۲ مرداد ۱۴۰۵",
    comments: "۶",
    likes: "۴۴۰",
    image: {
      src: "/figma/png/callCenter.png",
      alt: "پشتیبانی دات‌وان تریپ",
    },
    body: articleBody(),
  },
  {
    id: "lorestan",
    category: "اطلاعیه",
    title: "از ۲۹ آذر دات‌وان تریپ در لرستان شروع به خدمت‌رسانی می‌کند",
    date: "۱۰ مرداد ۱۴۰۵",
    comments: "۴",
    likes: "۳۱۰",
    image: {
      src: "/figma/png/information.png",
      alt: "تابلوی اطلاع‌رسانی",
    },
    body: articleBody(),
  },
  {
    id: "weight-update",
    category: "اطلاعیه",
    title: "آپدیت وزن ۵.۴ دات‌وان تریپ عرضه شد.",
    date: "۱۸ مرداد ۱۴۰۵",
    comments: "۴",
    likes: "۶۱۰",
    image: {
      src: "/figma/png/information.png",
      alt: "تابلوی اطلاع‌رسانی",
    },
    body: articleBody(),
  },
];

export function articleHref(article: Pick<Article, "id" | "href">) {
  return article.href ?? `/blog/${article.id}`;
}

export function getArticle(id: string) {
  return articles.find((article) => article.id === id);
}

export function getRelatedArticles(id: string, limit = 3) {
  const preferred = ["online-taxi", "fifty-thousand", "org-guide"];
  const picked = preferred
    .map((articleId) => articles.find((article) => article.id === articleId))
    .filter((article): article is Article => article !== undefined && article.id !== id);
  const extras = articles.filter(
    (article) => article.id !== id && !preferred.includes(article.id),
  );
  return [...picked, ...extras].slice(0, limit);
}
