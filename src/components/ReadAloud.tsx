import { Button } from "@/components/ui/button";
import { speakText, stopSpeaking, useLanguage } from "@/lib/i18n";
import { Square, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ReadAloud({
  text,
  label = "Listen",
  stopLabel = "Stop",
}: {
  text: string;
  label?: string;
  stopLabel?: string;
}) {
  const { language } = useLanguage();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const id = window.setInterval(() => {
      setSpeaking(window.speechSynthesis.speaking);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Button
      variant="secondary"
      onClick={() => {
        if (speaking) {
          stopSpeaking();
          setSpeaking(false);
          return;
        }
        const ok = speakText(text, language.speech);
        if (!ok) {
          toast.error("Voice playback is not supported in this browser.");
          return;
        }
        setSpeaking(true);
      }}
    >
      {speaking ? <Square className="size-4" /> : <Volume2 className="size-4" />}
      {speaking ? stopLabel : label}
    </Button>
  );
}
