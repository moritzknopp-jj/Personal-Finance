import type { FileCategory } from "@/types";
import { Badge } from "./ui/badge";

const CATEGORY_CONFIG: Record<FileCategory, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; emoji: string }> = {
  Images: { variant: "success", emoji: "🖼" },
  Videos: { variant: "warning", emoji: "🎬" },
  PDFs: { variant: "destructive", emoji: "📄" },
  Documents: { variant: "secondary", emoji: "📝" },
  Archives: { variant: "outline", emoji: "📦" },
  Audio: { variant: "default", emoji: "🎵" },
  Code: { variant: "secondary", emoji: "💻" },
  Other: { variant: "outline", emoji: "📁" },
};

export function CategoryBadge({ category }: { category: FileCategory }) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.Other;
  return (
    <Badge variant={config.variant}>
      {config.emoji} {category}
    </Badge>
  );
}
