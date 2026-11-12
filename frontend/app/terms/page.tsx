import type { Metadata } from "next";
import Link from "next/link";
import { Clause, LegalPage, Mail } from "../components/legal/LegalPage";

export const metadata: Metadata = {
    title: "Terms of Service — Brainly AI",
    description: "The rules for using Brainly: your account, your content, plans, and what we can and can't promise.",
    alternates: { canonical: "/terms" },
};

const SECTIONS = [
    { id: "agreement", title: "Agreeing to these terms" },
    { id: "account", title: "Your account" },
    { id: "content", title: "Your content" },
    { id: "acceptable-use", title: "Acceptable use" },
    { id: "ai", title: "AI answers" },
    { id: "plans", title: "Plans and limits" },
    { id: "sharing", title: "Sharing" },
    { id: "service", title: "Changes to Brainly" },
    { id: "ending", title: "Ending your account" },
    { id: "disclaimers", title: "Disclaimers" },
    { id: "liability", title: "Limitation of liability" },
    { id: "law", title: "Governing law" },
    { id: "changes", title: "Changes to these terms" },
    { id: "contact", title: "Contact" },
];

export default function TermsPage() {
    return (
        <LegalPage
            eyebrow="Terms of Service"
            title="The fair-play rules."
            intro={
                <p>
                    These terms are an agreement between you and Brainly AI (“Brainly”, “we”), the service at brainlyai.me together with its app and browser extension. They&apos;re written to be read. Our <Link href="/privacy" className="underline decoration-lp-line underline-offset-4 hover:decoration-lp-ink">Privacy Policy</Link> explains how we handle your data.
                </p>
            }
            sections={SECTIONS}
            other={{ href: "/privacy", label: "Privacy Policy" }}
        >
            <Clause id="agreement" title="Agreeing to these terms">
                <p>By creating an account or using Brainly, you agree to these terms. If you don&apos;t agree, please don&apos;t use Brainly. You must be at least 18 to use it.</p>
            </Clause>

            <Clause id="account" title="Your account">
                <ul>
                    <li>Give us a real email address you can receive mail at, and keep your password safe.</li>
                    <li>You&apos;re responsible for what happens in your account. If you think someone else has access, reset your password and use Settings → Connected devices → Sign out everywhere else, then tell us.</li>
                    <li>One person per account. Don&apos;t share or sell accounts.</li>
                </ul>
            </Clause>

            <Clause id="content" title="Your content">
                <ul>
                    <li><b>You own what you save.</b> Your notes, files and context stay yours.</li>
                    <li>You give Brainly permission to store, copy, process and display your content only as needed to run Brainly for you: fetching and reading links, transcribing, summarising, tagging, indexing, answering your questions, and showing collections you choose to share. This permission ends when you delete the content or your account, except for backups that expire on their own.</li>
                    <li>Only save content you have the right to save. Content from other websites belongs to its owners; Brainly keeps it for your personal reference and links back to the original.</li>
                    <li>Keep your own copies of anything important. You can download everything any time in Settings → Your data.</li>
                </ul>
            </Clause>

            <Clause id="acceptable-use" title="Acceptable use">
                <p>Don&apos;t use Brainly to:</p>
                <ul>
                    <li>break the law, or store or share illegal content, including child sexual abuse material;</li>
                    <li>infringe others&apos; copyright or privacy, or share someone&apos;s personal data without the right to;</li>
                    <li>harass, threaten or spread malware, spam or phishing, including through shared collections;</li>
                    <li>attack, overload, scrape or probe Brainly, get around its limits or security, or access other people&apos;s accounts;</li>
                    <li>resell Brainly, or use it to build a competing service or train AI models.</li>
                </ul>
                <p>We may remove content or suspend accounts that break these rules, and report illegal content to the authorities.</p>
            </Clause>

            <Clause id="ai" title="AI answers">
                <p>
                    Brainly&apos;s answers, summaries, tags and titles are written by AI from your saves. They can be incomplete or wrong, and a cited source may not say exactly what the answer claims. Check the original before relying on an answer, and don&apos;t use Brainly as a substitute for professional medical, legal, financial or other advice.
                </p>
            </Clause>

            <Clause id="plans" title="Plans and limits">
                <ul>
                    <li>Brainly is <b>free</b> to use, with limits on how many memories you can save, AI answers per day and upload size. Current limits are shown in Settings.</li>
                    <li>A paid Pro plan isn&apos;t available yet. When it is, its price and terms will be shown before you pay, and nothing will be charged without your agreement.</li>
                    <li>We may change the free plan&apos;s limits. If a change affects what you&apos;ve already saved, we&apos;ll tell you first.</li>
                </ul>
            </Clause>

            <Clause id="sharing" title="Sharing">
                <p>When you share a collection publicly, anyone with the link can view it. You&apos;re responsible for what you share, and you can stop sharing at any time.</p>
            </Clause>

            <Clause id="service" title="Changes to Brainly">
                <p>
                    Brainly is improving all the time, so features may change, be added or be removed. Brainly depends on third-party services (for example the AI providers and the websites you save), which can change or stop working. If we ever shut Brainly down, we&apos;ll give you at least 30 days&apos; notice to download your data.
                </p>
            </Clause>

            <Clause id="ending" title="Ending your account">
                <ul>
                    <li>You can delete your account at any time in Settings → Delete account. Your data is deleted as described in the Privacy Policy.</li>
                    <li>We may suspend or close accounts that seriously or repeatedly break these terms, or where the law requires it. Where it&apos;s reasonable and allowed, we&apos;ll tell you why and give you a chance to download your data.</li>
                </ul>
            </Clause>

            <Clause id="disclaimers" title="Disclaimers">
                <p>
                    Brainly is provided “as is” and “as available”. We work hard to keep it running and your data safe, but we can&apos;t promise it will always be available, error-free or that no data will ever be lost. To the extent the law allows, we disclaim all implied warranties, including fitness for a particular purpose.
                </p>
            </Clause>

            <Clause id="liability" title="Limitation of liability">
                <p>
                    To the extent the law allows, Brainly isn&apos;t liable for indirect, incidental, special or consequential damages, or for lost data, profits or business, arising from your use of Brainly. Our total liability for any claim is limited to the amount you paid us in the 12 months before it (for the free plan, that is zero). Nothing in these terms limits liability that can&apos;t be limited by law, or your rights as a consumer.
                </p>
            </Clause>

            <Clause id="law" title="Governing law">
                <p>
                    These terms are governed by the laws of India, and disputes go to the courts of India, unless the law where you live gives you the right to bring a claim locally. Before going to court, please email us so we can try to sort it out.
                </p>
            </Clause>

            <Clause id="changes" title="Changes to these terms">
                <p>If we change these terms, we&apos;ll update the date at the top. For significant changes we&apos;ll tell you by email or in the app before they take effect. Using Brainly after that means you accept the new terms.</p>
            </Clause>

            <Clause id="contact" title="Contact">
                <p>Questions about these terms: <Mail />.</p>
            </Clause>
        </LegalPage>
    );
}
