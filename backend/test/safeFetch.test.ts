import { describe, expect, it } from "vitest";
import { assertSafeUrlShape, isBlockedAddress, UnsafeUrlError } from "../src/lib/safeFetch";

describe("SSRF protection", () => {
    it.each(["127.0.0.1", "10.1.2.3", "172.16.5.4", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])(
        "blocks %s",
        (ip) => expect(isBlockedAddress(ip)).toBe(true)
    );

    it.each(["8.8.8.8", "142.250.72.14", "2606:4700:4700::1111"])("allows %s", (ip) => {
        expect(isBlockedAddress(ip)).toBe(false);
    });

    it("rejects non-http schemes, credentials and literal private IPs", () => {
        expect(() => assertSafeUrlShape("file:///etc/passwd")).toThrow(UnsafeUrlError);
        expect(() => assertSafeUrlShape("ftp://example.com")).toThrow(UnsafeUrlError);
        expect(() => assertSafeUrlShape("http://user:pass@example.com")).toThrow(UnsafeUrlError);
        expect(() => assertSafeUrlShape("http://169.254.169.254/latest/meta-data")).toThrow(UnsafeUrlError);
        expect(() => assertSafeUrlShape("http://[::1]:3001/")).toThrow(UnsafeUrlError);
        expect(() => assertSafeUrlShape("not a url")).toThrow(UnsafeUrlError);
    });

    it("accepts normal public URLs", () => {
        expect(assertSafeUrlShape("https://example.com/a?b=c").hostname).toBe("example.com");
    });
});
