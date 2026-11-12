/** "Chrome on Windows", from the User-Agent of the browser that connected the extension. */
export function describeUserAgent(ua: string | undefined): string {
    if (!ua) return "Browser extension";
    const browser =
        /Edg\//.test(ua) ? "Edge"
            : /OPR\/|Opera/.test(ua) ? "Opera"
                : /Firefox\//.test(ua) ? "Firefox"
                    : /Chrome\/|CriOS/.test(ua) ? "Chrome"
                        : /Safari\//.test(ua) ? "Safari"
                            : null;
    const os =
        /iPhone/.test(ua) ? "iPhone"
            : /iPad/.test(ua) ? "iPad"
                : /Android/.test(ua) ? "Android"
                    : /CrOS/.test(ua) ? "ChromeOS"
                        : /Windows/.test(ua) ? "Windows"
                            : /Mac OS X|Macintosh/.test(ua) ? "Mac"
                                : /Linux/.test(ua) ? "Linux"
                                    : null;
    if (browser && os) return `${browser} on ${os}`;
    return browser ?? os ?? "Browser extension";
}
