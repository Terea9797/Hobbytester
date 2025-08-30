import LandingPage from "./components/LandingPage";

export default function App() {
  return (
    <LandingPage
      title="<< Game Name Placeholder >>"
      subtitle="Live the streets. Forge your path. Open-world browser RP."
      heroSrc="/assets/hero.png"
      // apiBaseUrl="http://127.0.0.1:8000" // uncomment if backend is on a different origin
    />
  );
}

