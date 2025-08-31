import { Routes, Route } from "react-router-dom";
import VerifyEmail from "./pages/VerifyEmail";
import LandingPage from "./components/LandingPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            title="<< Game Name Placeholder >>"
            subtitle="Live the streets. Forge your path. Open-world browser RP."
            heroSrc="/assets/hero.png"
          />
        }
      />
      <Route path="/verify" element={<VerifyEmail />} />
    </Routes>
  );
}
