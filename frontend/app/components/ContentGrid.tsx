import { motion } from "motion/react";
import {
    Video,
    ExternalLink,
    FileText,
    Bookmark,
    Brain,
    ArrowRight,
    Plus,
    Sparkles,
    LayoutDashboard,
    Lightbulb,
    Settings,
    UserCircle2,
} from "lucide-react";

const cards = [
    {
        type: "youtube",
        data: {
            thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdyWvl4FI_M92Eri5ALLcwYVkR_bnkX7-YlauXusMUTJoiG1bSGkf-bn1SigSRQEyb1u7_o3UXliKyaSo1CnhdfB9JTMvBNiS3JR-fu-jOGAPLjpPg9_3H5Zb0FW2nIeeQjkdroAw1J9igdH0c6gtsZBSfwG0514LBadx5QxtYJrC_23QRyEgRApUGtYbIPHcXk-eMPhGrvI1CTqYauqSVPlsTH2ER7UIbYy_LqfwT08GYfH2f6EfWHCPoc0H6e_KgVfflM6lffcy",
            duration: "14:22",
            title: "The Future of Generative AI: Architectures and Implications",
            desc: "Deep dive into transformer models and the evolution of latent space representation in modern large language models.",
            saved: "Saved 2 days ago",
        },
    },
    {
        type: "tweet",
        data: {
            quote: '"The most powerful UI is the one that disappears. We aren\'t building tools; we are building extensions of human thought."',
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlRy4LlQGuEZOyb2ehETfK3Ktu7s3zVLUeh9AOEe6GAlGzUm0fp_A37BriuXvqkPOQP4ac6NAQD23PwVDBpI0yaoU6VIzM10ZYl12-MdoEyHQHZIfh-oh18W5Dy7jSI2-TZclUPNXo7rltoeZCWsKNSGP6nTfKyz8IZlzd5tN9qWZ5lb5NIsAhHqnqwqYS0jiKviTgryajwB0c4lyD26MOOCBqdu4PUD0a_FTwsKKO_7hAC11TS8a0-SIlhD5BsSMb_9GydRNzWDXj",
            handle: "@design_philosopher",
        },
    },
    {
        type: "pdf",
        data: {
            title: "Q4 Brainly_AI_Roadmap_Final.pdf",
            progress: 75,
            size: "12.4 MB",
        },
    },
];

export function ContentGrid() {

    return <div>
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto"
        >
            {/* YouTube card — tall */}
            <div className="md:row-span-2 flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all group">
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img
                        src={cards[0].data.thumbnail}
                        alt="YouTube Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Video className="w-10 h-10 text-white" fill="white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        {cards[0].data.duration}
                    </div>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Video className="w-3 h-3 text-red-500" fill="#ef4444" />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                YouTube Memory
                            </span>
                        </div>
                        <h3 className="text-sm font-bold leading-snug mb-1.5">{cards[0].data.title}</h3>
                        <p className="text-xs text-on-surface-variant/70 line-clamp-3">{cards[0].data.desc}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-3">
                        <span className="text-[9px] font-medium text-on-surface-variant/50">{cards[0].data.saved}</span>
                        <Bookmark className="w-3.5 h-3.5 text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Tweet card */}
            <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between group">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                                <span className="text-[#1DA1F2] text-xs font-bold">𝕏</span>
                            </div>
                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                Tweet Fragment
                            </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-on-surface-variant/40" />
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic">{cards[1].data.quote}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <img src={cards[1].data.avatar} alt="Avatar" className="w-5 h-5 rounded-full border border-outline-variant/30" />
                    <span className="text-[10px] font-semibold text-on-surface-variant">{cards[1].data.handle}</span>
                </div>
            </div>

            {/* PDF card */}
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 hover:border-secondary/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="w-20 h-20" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-container/20 rounded border border-tertiary/20">
                            <FileText className="w-3 h-3 text-tertiary" />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-tertiary">Technical Doc</span>
                        </div>
                        <h3 className="text-sm font-bold leading-snug">{cards[2].data.title}</h3>
                        <div className="space-y-1">
                            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                <div className="h-full bg-primary-container rounded-full" style={{ width: `${cards[2].data.progress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-on-surface-variant/60">
                                <span>{cards[2].data.progress}% Analyzed</span>
                                <span>{cards[2].data.size}</span>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center justify-center gap-1.5 py-2 bg-surface-container-highest rounded-lg border border-outline-variant/30 text-[10px] font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer">
                        Resume Reading
                    </button>
                </div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 hover:border-secondary/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="w-20 h-20" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-container/20 rounded border border-tertiary/20">
                            <FileText className="w-3 h-3 text-tertiary" />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-tertiary">Technical Doc</span>
                        </div>
                        <h3 className="text-sm font-bold leading-snug">{cards[2].data.title}</h3>
                        <div className="space-y-1">
                            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                <div className="h-full bg-primary-container rounded-full" style={{ width: `${cards[2].data.progress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-on-surface-variant/60">
                                <span>{cards[2].data.progress}% Analyzed</span>
                                <span>{cards[2].data.size}</span>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center justify-center gap-1.5 py-2 bg-surface-container-highest rounded-lg border border-outline-variant/30 text-[10px] font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer">
                        Resume Reading
                    </button>
                </div>
            </div>

            {/* Brainly Insights — full width */}
            <div className="md:col-span-2 flex items-center gap-4 bg-surface-container-low border border-outline-variant/10 rounded-xl p-5 hover:bg-surface-container-low/80 transition-all cursor-pointer group">
                <div className="hidden md:flex w-12 h-12 shrink-0 items-center justify-center bg-primary-container/10 rounded-xl border border-primary-container/20">
                    <Brain className="w-6 h-6 text-primary-container" fill="currentColor" fillOpacity={0.3} />
                </div>
                <div className="flex-grow space-y-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-bold tracking-widest uppercase text-primary">Brainly Insights</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug">
                        You've focused heavily on 'Interface Design' today.
                    </h3>
                    <p className="text-xs text-on-surface-variant/70">
                        I've synthesized 4 relevant articles and 2 podcasts from your library that might help with your current project. Want a summary?
                    </p>
                </div>
                <ArrowRight className="w-4 h-4 text-on-surface-variant/40 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
        </motion.section>
    </div>

}