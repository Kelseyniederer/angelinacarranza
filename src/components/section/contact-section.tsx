import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Icons } from "@/components/icons";
import { DATA } from "@/data/resume";

export default function ContactSection() {
  return (
    <div
      className="relative pt-24 pb-16 -mb-24 overflow-hidden"
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      <div className="absolute inset-0">
        <FlickeringGrid
          className="h-full w-full"
          squareSize={2}
          gridGap={2}
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 35%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 35%)",
          }}
        />
      </div>
      <div className="relative flex flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
          {DATA.sections.contact.heading}
        </h2>
        <div className="flex items-center gap-6">
          <a
            href={DATA.contact.social.LinkedIn.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-foreground/70 transition-colors"
            aria-label="LinkedIn"
          >
            <Icons.linkedin className="size-6" />
          </a>
          <a
            href={`mailto:${DATA.contact.email}`}
            className="text-foreground hover:text-foreground/70 transition-colors"
            aria-label="Email"
          >
            <Icons.email className="size-6" />
          </a>
        </div>
      </div>
    </div>
  );
}
