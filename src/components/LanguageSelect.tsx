import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, stopSpeaking, useLanguage } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageSelect() {
  const { language, setLanguageCode } = useLanguage();

  return (
    <Select
      value={language.code}
      onValueChange={(value) => {
        stopSpeaking();
        setLanguageCode(value);
      }}
    >
      <SelectTrigger
        className="h-9 w-[132px] gap-2 border-border/70 bg-secondary/40 text-sm"
        aria-label="Choose language"
      >
        <Languages className="size-4 shrink-0 text-primary" />
        <SelectValue placeholder={language.label}>{language.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {LANGUAGES.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
