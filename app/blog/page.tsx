import Header from "@/components/ui/Header/Header";
import PopularArticles from "@/components/ui/PopularArticles/PopularArticles";
import LatestArticles from "@/components/ui/LatestArticles/LatestArticles";
import Footer from "@/components/ui/footer/Footer";

import { listPublishedArticles } from "@/lib/cms/service";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const published = await listPublishedArticles();
  const popularArticles = published.slice(0, 5);
  const latestArticles = published;

  return (
    <>
      <Header variant="light" />

      <main className="mt-16 md:mt-20 lg:mt-24">
        <PopularArticles articles={popularArticles} />

        <LatestArticles articles={latestArticles} />

        <LatestArticles
          compact
          articles={latestArticles}
        />
      </main>

      <Footer />
    </>
  );
}