import { createRoot } from "react-dom/client";
import CoachPage from "@/app/coach/page";
import ChatPage from "@/app/chat/[id]/page";
import HomePage from "@/app/page";
import ReportPage from "@/app/report/[sid]/page";
import JourneyPage from "@/app/journey/page";
import WelcomePage from "@/app/welcome/page";
import { matchPath, useLocation } from "next/navigation";

// The journey screen asks the server which engine is running; here it's always local.
const realFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.endsWith("/api/status")) return Promise.resolve(new Response(JSON.stringify({ engine: "local", model: null })));
  return realFetch(input, init);
};

const ROUTES: [string, () => React.ReactElement][] = [
  ["/", () => <HomePage />],
  ["/welcome", () => <WelcomePage />],
  ["/journey", () => <JourneyPage />],
  ["/coach", () => <CoachPage />],
  ["/chat/:id", () => <ChatPage />],
  ["/report/:sid", () => <ReportPage />],
];

function App() {
  const loc = useLocation();
  const path = loc.split("?")[0];
  const route = ROUTES.find(([p]) => matchPath(p, path)) ?? ROUTES[0];
  return (
    <>
      <div className="ambient" />
      <div className="frame" key={loc}>
        {route[1]()}
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
