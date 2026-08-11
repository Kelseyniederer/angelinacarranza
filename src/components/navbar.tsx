import { DATA } from "@/data/resume";
import { Icons } from "@/components/icons";
import { SunIcon } from "@radix-ui/react-icons";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
  const linkedin = DATA.contact.social.LinkedIn;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  return (
    <div className="fixed top-4 right-4 z-30 flex items-center gap-3">
      <a
        href={linkedin.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/70 transition-colors"
      >
        <Icons.linkedin className="size-5" />
      </a>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="text-foreground hover:text-foreground/70 transition-colors cursor-pointer"
      >
        {isDark ? <Moon className="size-5" /> : <SunIcon className="size-5" />}
      </button>
    </div>
  );
}
