import FinalCTA from "@/components/landing/FinalCTA";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingHero from "@/components/landing/LandingHero";
import LandingNav from "@/components/landing/LandingNav";
import StatsAndGigs from "@/components/landing/StatsAndGigs";
import Testimonials from "@/components/landing/Testimonials";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main className="pt-24">
        <LandingHero />
        <StatsAndGigs />
        <FeaturesSection />
        <HowItWorks />
        <Testimonials />
        <FinalCTA />
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-background" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C9.243 2 7 4.243 7 7c0 1.75.905 3.289 2.274 4.182C7.64 12.158 6 14.368 6 17c0 1.657 1.343 3 3 3h6c1.657 0 3-1.343 3-3 0-2.632-1.64-4.842-3.274-5.818C16.095 10.289 17 8.75 17 7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3z" />
                </svg>
              </div>
              <span className="font-semibold">WorkBee</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2026 WorkBee. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
