import { Mic } from "lucide-react";

/**
 * Mic launcher — hands off to the centralized assistant (Chatbot),
 * which owns speech recognition, intent routing and multilingual replies.
 */
const VoiceCommand = () => {
  const handleVoice = () => {
    window.dispatchEvent(new CustomEvent("agrisetu:voice"));
  };

  return (
    <button
      onClick={handleVoice}
      className="fixed bottom-20 md:bottom-6 left-4 z-50 h-12 w-12 rounded-full shadow-xl flex items-center justify-center transition-all bg-card border border-border text-foreground hover:bg-accent"
      title="Voice Command"
      aria-label="Voice command"
    >
      <Mic className="h-5 w-5" />
    </button>
  );
};

export default VoiceCommand;
