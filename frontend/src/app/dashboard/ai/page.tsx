import CareerAssistant from "@/components/ai/CareerAssistant";
import NearbyGigsMap from "@/components/maps/NearbyGigsMap";

export default function AIDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Career Assistant</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalized gig recommendations powered by WorkBee AI
        </p>
      </div>
      <CareerAssistant />
      <div>
        <h2 className="text-lg font-semibold mb-3">Gigs near you</h2>
        <NearbyGigsMap />
      </div>
    </div>
  );
}
