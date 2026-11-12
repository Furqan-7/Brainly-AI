import type { Metadata } from "next";
import Link from "next/link";
import { Clause, LegalPage, Mail } from "../components/legal/LegalPage";

export const metadata: Metadata = {
    title: "Privacy Policy — Brainly AI",
    description: "What Brainly stores, why, who helps us run it, and how to export or delete your data.",
    alternates: { canonical: "/privacy" },
};

const SECTIONS = [
    { id: "summary", title: "The short version" },
    { id: "collect", title: "What we collect" },
    { id: "use", title: "How we use it" },
    { id: "ai", title: "AI and other services" },
    { id: "google", title: "Google and GitHub sign-in" },
    { id: "extension", title: "Browser extension" },
    { id: "sharing", title: "Sharing and links you save" },
    { id: "cookies", title: "Cookies" },
    { id: "retention", title: "How long we keep data" },
    { id: "rights", title: "Your choices and rights" },
    { id: "security", title: "Security" },
    { id: "children", title: "Children" },
    { id: "changes", title: "Changes" },
    { id: "contact", title: "Contact" },
];

export default function PrivacyPage() {
    return (
        <LegalPage
            eyebrow="Privacy Policy"
            title="Your saves are yours."
            intro={
                <p>
                    Brainly AI (“Brainly”, “we”) is a personal knowledge base at brainlyai.me: you save links, videos, reels, notes and files, and ask questions about them. This policy explains what we store, why, which services help us run Brainly, and how you can export or delete everything.
                </p>
            }
            sections={SECTIONS}
            other={{ href: "/terms", label: "Terms of Service" }}
        >
            <Clause id="summary" title="The short version">
                <ul>
                    <li>We store what you save so we can search it and answer your questions. That&apos;s the whole business.</li>
                    <li>We <b>don&apos;t sell</b> your data, <b>don&apos;t show ads</b>, and don&apos;t use analytics or tracking cookies.</li>
                    <li>To read and answer, your content is processed by a few AI providers (listed below).</li>
                    <li>You can <b>download everything</b> or <b>delete your account</b> any time in Settings.</li>
                </ul>
            </Clause>

            <Clause id="collect" title="What we collect">
                <ul>
                    <li><b>Account:</b> your name, email address and, if you sign up with email, your password (stored only as a one-way bcrypt hash). If you use Google or GitHub, we receive your name, email address and account ID from them.</li>
                    <li><b>What you save:</b> links and the text, captions, transcripts, titles and thumbnails we fetch for them; notes; uploaded PDFs, images and voice notes; your personal context (“why I saved this”), tags, stars, collections and the summaries and tags Brainly writes.</li>
                    <li><b>Search index:</b> your saves split into passages, with numeric “embeddings” that let Brainly find them by meaning.</li>
                    <li><b>Chats:</b> the questions you ask and Brainly&apos;s answers, so you can return to past conversations.</li>
                    <li><b>Usage and devices:</b> how many memories you have and AI answers you used today (for plan limits), and for each connected browser extension its browser name (e.g. “Chrome on Windows”), when it was connected and last used.</li>
                    <li><b>Technical data:</b> our servers and hosting providers log requests (time, path, status, IP address) for security, rate limiting and fixing errors.</li>
                </ul>
            </Clause>

            <Clause id="use" title="How we use it">
                <ul>
                    <li>To run Brainly for you: save and process your memories, search them, answer your questions with citations, and show your library, collections, knowledge graph and Rediscover reviews.</li>
                    <li>To keep your account secure: sign-in, password reset and email-confirmation emails, rate limiting and abuse prevention.</li>
                    <li>To apply plan limits and keep the service running.</li>
                    <li>To reply when you contact us.</li>
                </ul>
                <p>We don&apos;t use your content to train our own AI models, and we don&apos;t look at your saves except when needed to fix a problem you report or to deal with abuse or a legal request.</p>
            </Clause>

            <Clause id="ai" title="AI and other services">
                <p>Brainly relies on these providers. Each receives only what it needs for its job:</p>
                <ul>
                    <li><b>Groq</b>: writes answers, summaries, tags, titles and chat names, and transcribes audio from reels, TikToks and voice notes. Receives your question with the relevant passages, or the text or audio being processed.</li>
                    <li><b>Nomic</b>: turns passages and questions into embeddings for search.</li>
                    <li><b>Google Gemini</b>: describes images and reads text from images and scanned PDFs.</li>
                    <li><b>Cohere</b>: re-ranks search results by relevance. Receives your question and candidate passages.</li>
                    <li><b>Hosting and storage</b>: Vercel (website), Render (API), a managed PostgreSQL database, and file storage for uploads.</li>
                    <li><b>Email</b>: our email provider sends account emails (password reset, email confirmation).</li>
                </ul>
                <p>These providers process data under their own terms and privacy policies. Some may keep requests for a limited time for abuse monitoring, and some free plans (for example Google&apos;s free Gemini API tier) allow the provider to use submitted content to improve its services. Please don&apos;t upload anything you wouldn&apos;t want processed this way. Data may be processed in countries other than yours, including the United States.</p>
            </Clause>

            <Clause id="google" title="Google and GitHub sign-in">
                <p>
                    If you sign in with Google or GitHub, we only ask for your basic profile and email address. We use them to create your account and sign you in, and keep only your name, email and the provider&apos;s account ID. We don&apos;t keep your Google or GitHub access tokens, can&apos;t read your Gmail, Drive or repositories, and never share this data or use it for advertising.
                </p>
                <p>
                    Brainly&apos;s use of information received from Google APIs adheres to the{" "}
                    <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
                </p>
            </Clause>

            <Clause id="extension" title="Browser extension">
                <ul>
                    <li>The extension only sends something to Brainly when <b>you</b> choose to save it: the page&apos;s address and title, a link you right-click, or text you select, plus any note you add.</li>
                    <li>It doesn&apos;t read your browsing history or the pages you visit, and doesn&apos;t run on other websites. Its only script runs on brainlyai.me, to sign the extension in.</li>
                    <li>It keeps its sign-in token and Brainly&apos;s address in your browser&apos;s extension storage. You can sign it out from the extension&apos;s settings or from Settings → Connected devices.</li>
                </ul>
            </Clause>

            <Clause id="sharing" title="Sharing and links you save">
                <ul>
                    <li><b>Public collections:</b> if you share a collection, anyone with its link can see its name and description, your display name, and each item&apos;s title, link, summary, tags, thumbnail and uploaded file. Your notes and personal context are never shown. You can stop sharing at any time.</li>
                    <li><b>Links you save:</b> Brainly&apos;s servers visit them to fetch their content, transcripts and a preview screenshot. Those websites see our servers, not you.</li>
                    <li><b>Legal reasons:</b> we may disclose data if required by law, or to protect Brainly, our users or others from harm.</li>
                    <li><b>If Brainly changes hands:</b> your data could transfer to a new owner, who must keep this policy&apos;s protections or tell you first.</li>
                </ul>
            </Clause>

            <Clause id="cookies" title="Cookies">
                <p>
                    We use one essential cookie, <b>brainly_token</b>, to keep you signed in (httpOnly, up to 7 days). The app also remembers a few small preferences in your browser&apos;s local storage, such as where to return after signing in. There are no advertising, analytics or third-party tracking cookies.
                </p>
            </Clause>

            <Clause id="retention" title="How long we keep data">
                <ul>
                    <li>We keep your account and saves until you delete them or your account.</li>
                    <li>Deleting a memory removes it, its search index and its file straight away. Deleting your account removes your account, every memory and file, collections, chats and connected devices straight away.</li>
                    <li>Copies in database backups and provider logs are removed as they expire, normally within 30 days.</li>
                </ul>
            </Clause>

            <Clause id="rights" title="Your choices and rights">
                <ul>
                    <li><b>Export:</b> Settings → Your data → Download everything gives you a ZIP of all your memories, notes, files, collections and chats.</li>
                    <li><b>Correct:</b> edit any memory&apos;s title, note, context and tags in your library.</li>
                    <li><b>Delete:</b> delete single memories, or your whole account in Settings → Delete account.</li>
                    <li><b>Sign out devices:</b> Settings → Connected devices.</li>
                </ul>
                <p>
                    Depending on where you live (for example under the EU/UK GDPR, India&apos;s Digital Personal Data Protection Act or California law), you may also have the right to access, correct, delete or move your data, object to or restrict processing, withdraw consent, and complain to your data protection authority. We process your data to provide the service you asked for, to keep it secure, and with your consent where needed. Email <Mail /> and we&apos;ll respond within 30 days.
                </p>
            </Clause>

            <Clause id="security" title="Security">
                <p>
                    Brainly uses HTTPS, stores passwords as bcrypt hashes, keeps sessions in httpOnly cookies, rate-limits sign-in and email endpoints, serves your files only to you (or through collections you share), and lets you sign out lost devices. No service is perfectly secure, so please use a strong password. If we learn of a breach affecting your data, we&apos;ll notify you as the law requires.
                </p>
            </Clause>

            <Clause id="children" title="Children">
                <p>Brainly isn&apos;t meant for children. You must be at least 18 to use it. If you believe a child has given us data, email <Mail /> and we&apos;ll delete it.</p>
            </Clause>

            <Clause id="changes" title="Changes">
                <p>If we change this policy, we&apos;ll update the date at the top. For significant changes we&apos;ll tell you by email or in the app before they take effect.</p>
            </Clause>

            <Clause id="contact" title="Contact">
                <p>
                    Questions or requests about your data: <Mail />. See also our <Link href="/terms">Terms of Service</Link>.
                </p>
            </Clause>
        </LegalPage>
    );
}
