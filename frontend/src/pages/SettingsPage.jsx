import PreviewSection from "../components/settingsPage/previewSection";
import Themes from "../components/settingsPage/Themes";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-base-content/70">
              Choose a theme for your chat interface
            </p>
          </div>
          <ArrowLeft className="size-8" onClick={() => navigate("/")} />
        </div>

        <Themes />

        <PreviewSection />
      </div>
    </div>
  );
};
export default SettingsPage;
