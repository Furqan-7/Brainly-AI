import {
    Clapperboard,
    FileText,
    Globe,
    Image,
    MessageSquare,
    Mic,
    Music2,
    StickyNote,
    Video,
    type LucideIcon,
} from "lucide-react";
import type { MemoryType } from "../../types/memory";

/** Display label, icon and accent colour for each memory type — shared by cards, sources and filters. */
export const TYPE_META: Record<MemoryType, { label: string; plural: string; icon: LucideIcon; color: string }> = {
    url: { label: "Web Page", plural: "Web Pages", icon: Globe, color: "text-primary" },
    youtube: { label: "YouTube", plural: "YouTube", icon: Video, color: "text-error" },
    reel: { label: "Instagram Reel", plural: "Reels", icon: Clapperboard, color: "text-pink-600" },
    tiktok: { label: "TikTok", plural: "TikToks", icon: Music2, color: "text-cyan-600" },
    tweet: { label: "Tweet", plural: "Tweets", icon: MessageSquare, color: "text-sky-600" },
    pdf: { label: "PDF", plural: "Documents", icon: FileText, color: "text-orange-600" },
    image: { label: "Image", plural: "Images", icon: Image, color: "text-emerald-600" },
    note: { label: "Note", plural: "Notes", icon: StickyNote, color: "text-yellow-600" },
    audio: { label: "Voice Note", plural: "Voice Notes", icon: Mic, color: "text-violet-600" },
};

export const ALL_TYPES = Object.keys(TYPE_META) as MemoryType[];
