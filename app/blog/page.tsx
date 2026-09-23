import Header from "@/components/ui/Header/Header";
import PopularArticles from "@/components/ui/PopularArticles/PopularArticles";
import LatestArticles from "@/components/ui/LatestArticles/LatestArticles";
import Footer from "@/components/ui/footer/Footer";

import {
  getLatestArticles,
  getPopularArticles,
} from "@/lib/articles";

export default function BlogPage() {
  const popularArticles = getPopularArticles(5);
  const latestArticles = getLatestArticles();

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