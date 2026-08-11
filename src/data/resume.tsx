import { Icons } from "@/components/icons";
import { House, Library } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Nodejs } from "@/components/ui/svgs/nodejs";
import { Python } from "@/components/ui/svgs/python";
import { Golang } from "@/components/ui/svgs/golang";
import { Postgresql } from "@/components/ui/svgs/postgresql";
import { Docker } from "@/components/ui/svgs/docker";
import { Kubernetes } from "@/components/ui/svgs/kubernetes";
import { Astro } from "@/components/ui/svgs/astro";
import { Java } from "@/components/ui/svgs/java";
import { Csharp as CSharp } from "@/components/ui/svgs/csharp";
import { RESUME_DATA as resumeData } from "./resume-data";
import type { ComponentType } from "react";

// Map skill names → icon components. Add new entries here as needed.
const SKILL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Astro,
  React: ReactLight,
  "Next.js": NextjsIconDark,
  TypeScript: Typescript,
  Typescript,
  "Node.js": Nodejs,
  Python,
  Go: Golang,
  Postgres: Postgresql,
  PostgreSQL: Postgresql,
  Docker,
  Kubernetes,
  Java,
  "C#": CSharp,
};

// Map link type strings → icon elements used in project cards.
const PROJECT_LINK_ICONS: Record<string, React.ReactElement> = {
  Website: <Icons.globe className="size-3" />,
  Source: <Icons.github className="size-3" />,
  GitHub: <Icons.github className="size-3" />,
  AppStore: <Icons.globe className="size-3" />,
  PlayStore: <Icons.globe className="size-3" />,
};

// Map hackathon link types → icon elements.
const HACKATHON_LINK_ICONS: Record<string, React.ReactElement> = {
  github: <Icons.github className="h-4 w-4" />,
  website: <Icons.globe className="h-4 w-4" />,
  Source: <Icons.github className="h-4 w-4" />,
  Devpost: <Icons.globe className="h-4 w-4" />,
};

export const DATA = {
  ...resumeData,

  sections: {
    about: { order: 1, enabled: true, heading: "About" },
    work: { order: 2, enabled: true, heading: "Work Experience", presentLabel: "Present" },
    education: { order: 3, enabled: true, heading: "Education" },
    skills: { order: 4, enabled: true, heading: "Skills" },
    projects: {
      order: 5,
      enabled: true,
      label: "Featured",
      heading: "Featured Work",
      text: "A selection of writing and projects outside of my day-to-day.",
    },
    hackathons: {
      order: 7,
      enabled: false,
      label: "Hackathons",
      heading: "I like building things",
      text: "During my time in university, I attended {count}+ hackathons. People from around the country would come together and build incredible things in 2-3 days. It was eye-opening to see the endless possibilities brought to life by a group of motivated and passionate individuals.",
    },
    photos: { order: 6, enabled: false, heading: "My Recent Travels" },
    contact: {
      order: 8,
      enabled: true,
      label: "Contact",
      heading: "Get in Touch",
      text: "Want to chat? Just shoot me a dm with a direct question on twitter and I'll respond whenever I can. I will ignore all soliciting.",
    },
  },

  navbar: [
    { href: "/", icon: House, label: "Home" },
    { href: "/blog", icon: Library, label: "Blog" },
  ],

  skills: resumeData.skills.map((name) => ({
    name,
    icon: SKILL_ICONS[name] ?? null,
  })),

  contact: {
    email: resumeData.contact.email,
    tel: resumeData.contact.tel,
    social: {
      GitHub: {
        name: "GitHub",
        url: resumeData.contact.social.GitHub.url,
        icon: Icons.github,
        navbar: resumeData.contact.social.GitHub.navbar,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: resumeData.contact.social.LinkedIn.url,
        icon: Icons.linkedin,
        navbar: resumeData.contact.social.LinkedIn.navbar,
      },
      X: {
        name: "X",
        url: resumeData.contact.social.X.url,
        icon: Icons.x,
        navbar: resumeData.contact.social.X.navbar,
      },
      Youtube: {
        name: "Youtube",
        url: resumeData.contact.social.Youtube.url,
        icon: Icons.youtube,
        navbar: resumeData.contact.social.Youtube.navbar,
      },
      email: {
        name: "Send Email",
        url: `mailto:${resumeData.contact.email}`,
        icon: Icons.email,
        navbar: false,
      },
    },
  },

  work: resumeData.work.map((job) => ({
    ...job,
    end: job.end ?? undefined,
  })),

  projects: resumeData.projects.map((p) => ({
    ...p,
    links: p.links.map((l) => ({
      ...l,
      icon: PROJECT_LINK_ICONS[l.type] ?? <Icons.globe className="size-3" />,
    })),
  })),

  hackathons: resumeData.hackathons.map((h) => ({
    ...h,
    win: h.win ?? undefined,
    links: h.links.map((l) => ({
      ...l,
      icon:
        HACKATHON_LINK_ICONS[l.type] ??
        HACKATHON_LINK_ICONS[l.title] ??
        <Icons.globe className="h-4 w-4" />,
    })),
  })),
};
