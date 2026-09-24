import type { Metadata } from "next";
import Header from "@/components/ui/Header/Header";
import Footer from "@/components/ui/footer/Footer";
import ContactForm from "@/components/forms/ContactForm";
import DriverForm from "@/components/forms/DriverForm";
import CareerForm from "@/components/forms/CareerForm";
import SponsorshipForm from "@/components/forms/SponsorshipForm";
import styles from "./forms.module.css";

export const metadata: Metadata = {
  title: "فرم‌ها | دات‌وان تریپ",
};

export default function FormsPage() {
  return (
    <div className={styles.page}>
      <Header variant="light" />
      <main className={styles.main}>
        <ContactForm />
        <DriverForm />
        <CareerForm />
        <SponsorshipForm />
      </main>
      <Footer />
    </div>
  );
}
