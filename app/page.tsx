import { getCurrentUser } from "@/lib/auth/helpers";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default async function Home() {
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user);

  return (
    <div className="flex flex-1 flex-col">
      <Hero isAuthenticated={isAuthenticated} />
      <HowItWorks />
      <FeaturesGrid />
      <CtaSection isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}
