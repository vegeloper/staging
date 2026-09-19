import Header from "@/components/ui/Header/Header";


import PopularArticles from "@/components/ui/PopularArticles/PopularArticles";
import LatestArticles from "@/components/ui/LatestArticles/LatestArticles";
import Footer from "@/components/ui/footer/Footer";
export default function page() {
  return (
    <>
      <Header variant="light" />

      <div className="max-lg:mt-[5vh]">
        <PopularArticles />
      </div>
      <LatestArticles />
      <LatestArticles compact />
      <Footer/>
    </>
  );
}
