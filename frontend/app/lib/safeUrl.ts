import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Guards for the website-preview screenshotter: it opens URLs that users saved, so it must never
 * be pointed at private or internal addresses (localhost, cloud metadata endpoints, LAN hosts…).
 */

const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

function ipv4ToInt(ip: string) {
    return ip.split(".").reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
}

const PRIVATE_V4: Array<[string, number]> = [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
    ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

/** True for loopback, private, link-local, reserved and multicast addresses (IPv4 and IPv6). */
export function isPrivateIp(ip: string): boolean {
    if (isIP(ip) === 4) {
        const n = ipv4ToInt(ip);
        return PRIVATE_V4.some(([base, bits]) => (n >>> (32 - bits)) === (ipv4ToInt(base) >>> (32 - bits)));
    }
    const v6 = ip.toLowerCase().replace(/^\[|\]$/g, "");
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return (
        v6 === "::" || v6 === "::1" ||
        /^f[cd]/.test(v6) ||            // fc00::/7 unique local
        /^fe[89ab]/.test(v6) ||         // fe80::/10 link-local
        /^ff/.test(v6) ||               // multicast
        v6.startsWith("64:ff9b:") ||    // NAT64, can reach IPv4 private ranges
        v6.startsWith("2001:db8:")      // documentation
    );
}

/** Parses a user-supplied URL; null unless it is a plain public http(s) address. */
export function parsePublicUrl(raw: string | null): URL | null {
    if (!raw || raw.length > 2048) return null;
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password || !ALLOWED_PORTS.has(url.port)) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (isIP(host.replace(/^\[|\]$/g, "")) && isPrivateIp(host)) return null;
    return url;
}

const hostVerdicts = new Map<string, Promise<boolean>>();

/** Resolves a hostname and checks every address it points to is public. Cached per process. */
export function isPublicHost(hostname: string): Promise<boolean> {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (isIP(host)) return Promise.resolve(!isPrivateIp(host));
    let verdict = hostVerdicts.get(host);
    if (!verdict) {
        verdict = lookup(host, { all: true })
            .then((addrs) => addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address)))
            .catch(() => false);
        hostVerdicts.set(host, verdict);
        if (hostVerdicts.size > 2000) hostVerdicts.delete(hostVerdicts.keys().next().value!);
    }
    return verdict;
}
