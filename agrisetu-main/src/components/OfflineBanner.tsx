import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const OfflineBanner = () => {
  const { t } = useLanguage();
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="fixed inset-x-0 top-16 z-40 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 shadow-sm">
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      {t("offlineMessage")}
    </div>
  );
};

export default OfflineBanner;
