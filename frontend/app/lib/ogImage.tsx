import { ImageResponse } from "next/og";

/** Size X, LinkedIn and Facebook expect for a large preview card. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#faf5f2";
const INK = "#141414";
const MUTED = "#6d6966";
const SIGNAL = "#b4472b";

/** The Brainly mark (same waves as app/icon.svg). */
function Logo({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill={INK} />
            <g transform="translate(6 4) scale(1.625)" fill="none" stroke={PAPER} strokeWidth="2.6" strokeLinecap="round">
                <path d="M9 5.6c2.4-1.3 4.6 1.3 7 0s4.6-1.3 7 0" />
                <path d="M5.2 10.2c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
                <path d="M3.6 15c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
                <path d="M3.6 19.8c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
                <path d="M5.2 24.6c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
                <path d="M9 29c2.4-1.3 4.6 1.3 7 0s4.6-1.3 7 0" />
            </g>
        </svg>
    );
}

/** Renders a 1200×630 preview card: logo, a headline, a line of detail and a footer. */
export function renderOgImage({ eyebrow, title, subtitle, footer }: { eyebrow?: string; title: string; subtitle?: string; footer?: string }) {
    const clipped = title.length > 70 ? `${title.slice(0, 67)}…` : title;
    const sub = subtitle && subtitle.length > 140 ? `${subtitle.slice(0, 137)}…` : subtitle;
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "72px 80px",
                    backgroundColor: PAPER,
                    backgroundImage: "radial-gradient(#e7ddd7 2px, transparent 2px)",
                    backgroundSize: "28px 28px",
                    color: INK,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <Logo size={64} />
                    <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Brainly AI</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {eyebrow && (
                        <div style={{ fontSize: 26, fontWeight: 700, color: SIGNAL, textTransform: "uppercase", letterSpacing: 3 }}>{eyebrow}</div>
                    )}
                    <div style={{ fontSize: clipped.length > 40 ? 64 : 80, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{clipped}</div>
                    {sub && <div style={{ fontSize: 32, color: MUTED, lineHeight: 1.35 }}>{sub}</div>}
                </div>

                <div style={{ display: "flex", fontSize: 26, color: MUTED }}>{footer ?? "Reels · Videos · Links · PDFs · Notes"}</div>
            </div>
        ),
        OG_SIZE,
    );
}
