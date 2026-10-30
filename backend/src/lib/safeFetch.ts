import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

// Addresses a user-supplied URL must never reach: loopback, private ranges, link-local
// (incl. the 169.254.169.254 cloud metadata endpoint), CGNAT, multicast and reserved space.
const blocked = new net.BlockList();
for (const [addr, prefix] of [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
] as const) blocked.addSubnet(addr, prefix, "ipv4");
for (const [addr, prefix] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const)
    blocked.addSubnet(addr, prefix, "ipv6");

export function isBlockedAddress(ip: string): boolean {
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) return blocked.check(mapped[1], "ipv4");
    const family = net.isIPv6(ip) ? "ipv6" : "ipv4";
    return blocked.check(ip, family);
}

export class UnsafeUrlError extends Error { }

export function assertSafeUrlShape(url: string): URL {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new UnsafeUrlError("Invalid URL");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) throw new UnsafeUrlError("Only http(s) URLs are allowed");
    if (parsed.username || parsed.password) throw new UnsafeUrlError("URLs with credentials are not allowed");
    if (net.isIP(parsed.hostname.replace(/^\[|\]$/g, "")) && isBlockedAddress(parsed.hostname.replace(/^\[|\]$/g, "")))
        throw new UnsafeUrlError("This address is not allowed");
    return parsed;
}

// Checked at connect time, so redirects and DNS rebinding can't sneak past the check.
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, "", 4);
        const list = addresses as dns.LookupAddress[];
        const bad = list.find((a) => isBlockedAddress(a.address));
        if (bad) return callback(new UnsafeUrlError(`Blocked address for ${hostname}`), "", 4);
        if ((options as dns.LookupOptions).all) return (callback as any)(null, list);
        callback(null, list[0].address, list[0].family);
    });
};

const httpAgent = new http.Agent({ lookup: safeLookup });
const httpsAgent = new https.Agent({ lookup: safeLookup });

// When an outbound proxy is configured, the proxy itself does the DNS resolution, so we
// fall back to checking the hostname up front.
const usingProxy = Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy);

async function assertHostResolvesPublic(hostname: string) {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (addresses.some((a) => isBlockedAddress(a.address))) throw new UnsafeUrlError(`Blocked address for ${hostname}`);
}

/** Shape + DNS check for URLs handed to tools that do their own fetching (e.g. yt-dlp). */
export async function assertPublicUrl(url: string): Promise<URL> {
    const parsed = assertSafeUrlShape(url);
    await assertHostResolvesPublic(parsed.hostname);
    return parsed;
}

/** GET a user-supplied URL with SSRF protection, a timeout and a response size cap. */
export async function safeGet<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const parsed = assertSafeUrlShape(url);
    if (usingProxy) await assertHostResolvesPublic(parsed.hostname);

    return axios.get<T>(parsed.toString(), {
        timeout: 15000,
        maxContentLength: 10 * 1024 * 1024,
        maxRedirects: 5,
        ...(usingProxy ? {} : { httpAgent, httpsAgent }),
        ...config,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrainlyBot/1.0)", ...(config.headers ?? {}) },
    });
}
