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

/**
 * Display label, icon and accent colour for each memory type — shared by cards, sources and filters.
 * `chip` is the background of the small square icon in a card's source line.
 */
export const TYPE_META: Record<MemoryType, { label: string; plural: string; icon: LucideIcon; color: string; chip: string }> = {
    url: { label: "Web Page", plural: "Web Pages", icon: Globe, color: "text-primary", chip: "bg-on-surface-variant" },
    youtube: { label: "YouTube", plural: "YouTube", icon: Video, color: "text-error", chip: "bg-[#e5372f]" },
    reel: { label: "Instagram Reel", plural: "Reels", icon: Clapperboard, color: "text-pink-600", chip: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]" },
    tiktok: { label: "TikTok", plural: "TikToks", icon: Music2, color: "text-cyan-600", chip: "bg-on-surface" },
    tweet: { label: "Tweet", plural: "Tweets", icon: MessageSquare, color: "text-sky-600", chip: "bg-on-surface" },
    pdf: { label: "PDF", plural: "Documents", icon: FileText, color: "text-orange-600", chip: "bg-[#c2551f]" },
    image: { label: "Image", plural: "Images", icon: Image, color: "text-emerald-600", chip: "bg-emerald-600" },
    note: { label: "Note", plural: "Notes", icon: StickyNote, color: "text-yellow-600", chip: "bg-secondary" },
    audio: { label: "Voice Note", plural: "Voice Notes", icon: Mic, color: "text-violet-600", chip: "bg-primary" },
};

export const ALL_TYPES = Object.keys(TYPE_META) as MemoryType[];
