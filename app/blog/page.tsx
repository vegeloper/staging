import Header from "@/components/ui/Header/Header";
import PopularArticles from "@/components/ui/PopularArticles/PopularArticles";
import LatestArticles from "@/components/ui/LatestArticles/LatestArticles";
import Footer from "@/components/ui/footer/Footer";
import { getPublicFeeds } from "@/lib/cms/service";

export const dynamic = "force-dynamic";

export default async function page() {
  const { popular, articles, news } = await getPublicFeeds();

  return (
    <>
      <Header variant="light" />

      <div className="mt-20 max-lg:mt-[5vh]">
        <PopularArticles articles={popular} />
        <LatestArticles
          articles={articles}
          categories={["همه", "مقالات", "راهنما"]}
          seeAllHref="/blog"
          title="آخرین مطالب:"
        />
        {news.length > 0 ? (
          <LatestArticles
            compact
            articles={news}
            categories={["همه", "اخبار", "اطلاعیه"]}
            seeAllHref="/blog"
            title="آخرین اخبار:"
          />
        ) : null}
      </div>
      <Footer />
    </>
  );
}
