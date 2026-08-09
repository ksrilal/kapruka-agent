import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Privacy Policy — Kiyo",
  description: "How Kiyo and Kapruka collect, use, and protect your personal data.",
};

const LAST_UPDATED = "9 August 2026";

export default function PrivacyPage() {
  return (
    <div className="flex h-full w-full justify-center overflow-y-auto">
    <div className="mx-auto w-full max-w-2xl px-4 py-8 animate-fade-up">

      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-[13px] transition-colors"
        style={{ color: "var(--ink-3)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>
      </Link>

      <div className="mb-10">
        <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: "var(--purple-light)" }}>
          Legal
        </p>
        <h1 className="text-[32px] font-bold leading-tight text-foreground mb-3">
          Privacy Policy
        </h1>
        <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="flex flex-col gap-8 text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>

        <Section title="1. Overview">
          <p>
            <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;the assistant&rdquo;) is an AI shopping interface operated
            by Kapruka Holdings (Pvt) Ltd (&ldquo;Kapruka&rdquo;). This policy explains what data we collect
            when you use <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>, how we use it, and your rights. By using <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> you agree to the
            practices described here.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <ul className="flex flex-col gap-2 list-none">
            <Li><strong className="text-foreground">Conversation content</strong> — the messages you type into <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>&apos;s chat interface, including product queries, delivery locations, and order preferences.</Li>
            <Li><strong className="text-foreground">Order information</strong> — name, delivery address, phone number, and email address you provide when placing an order.</Li>
            <Li><strong className="text-foreground">Account sign-in (optional)</strong> — if you choose to sign in, the email address you provide is used to look up your existing Kapruka order and address history. No password is collected or stored.</Li>
            <Li><strong className="text-foreground">Device and usage data</strong> — browser type, operating system, IP address, and interaction logs collected automatically for security and performance monitoring.</Li>
            <Li><strong className="text-foreground">Cookies and local storage</strong> — cart contents are kept in your browser's session storage for your current tab session (cleared when you close the tab); chat history (your last few conversations) and preferences are kept in local storage so they persist across visits.</Li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-foreground">not</strong> collect payment card details. All payment processing
            is handled directly by Kapruka's PCI-compliant checkout infrastructure.
          </p>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="flex flex-col gap-2 list-none">
            <Li>To process and fulfil orders placed through <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>.</Li>
            <Li>To provide personalised product recommendations during your session.</Li>
            <Li>To detect and prevent fraud or abuse.</Li>
            <Li>To improve the accuracy and relevance of <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>&apos;s AI responses.</Li>
            <Li>To send order confirmation and delivery updates (using the contact details you provide).</Li>
          </ul>
          <p className="mt-3">
            Conversation data may be reviewed by Kapruka's engineering team in anonymised or
            aggregated form to improve the service. We do not sell your personal data to third parties.
          </p>
        </Section>

        <Section title="4. AI Processing">
          <p>
            <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> is powered by a third-party large language model (such as Anthropic Claude,
            OpenAI GPT, or Google Gemini, depending on configuration). Messages you send may be processed by the
            respective AI provider's infrastructure, subject to their privacy policies. We do not
            pass personally identifiable information to the AI model unless you include it in a
            message yourself (e.g. a delivery address).
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            Chat history, cart contents, and session state live entirely in your browser's local
            storage — <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> does not operate a backend database and does not persist your
            conversations on its own servers. During an active session, your messages pass through
            <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>&apos;s server only momentarily, to be relayed to the AI provider and to Kapruka&apos;s order
            systems. Order records themselves are retained by Kapruka as required by Sri Lankan
            commercial law.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> uses essential browser storage (localStorage and sessionStorage) to maintain
            your cart, chat history, and session state. No third-party advertising or tracking
            cookies are set by <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>. You can clear your browser storage at any time through your
            browser settings, which will reset your cart and history.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="flex flex-col gap-2 list-none mt-2">
            <Li>Request access to any personal data Kapruka holds about you.</Li>
            <Li>Request correction of inaccurate data.</Li>
            <Li>Request deletion of your data where no legal obligation requires us to retain it.</Li>
            <Li>Withdraw consent for marketing communications at any time.</Li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a
              href="mailto:colombo.office@kapruka.com"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
              style={{ color: "var(--purple-light)" }}
            >
              colombo.office@kapruka.com
            </a>
            .
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            All data is transmitted over HTTPS. Kapruka employs industry-standard security
            practices including encryption at rest and in transit, role-based access controls,
            and regular security audits. Despite these measures, no system is entirely secure —
            please do not share sensitive credentials through the chat interface.
          </p>
        </Section>

        <Section title="9. Third-Party Services">
          <p>
            <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> integrates with the following third-party services, each governed by their own
            privacy policies:
          </p>
          <ul className="flex flex-col gap-2 list-none mt-2">
            <Li><strong className="text-foreground">Kapruka.com</strong> — order fulfilment, payment processing, and logistics.</Li>
            <Li><strong className="text-foreground">AI language model provider</strong> — large language model processing (Anthropic Claude, OpenAI GPT, or Google Gemini, depending on configuration).</Li>
            <Li><strong className="text-foreground">Vercel</strong> — hosting and edge network.</Li>
          </ul>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy from time to time. Material changes will be indicated by
            an updated &ldquo;Last updated&rdquo; date at the top of this page. Continued use of <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> after
            changes constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For privacy-related enquiries, contact Kapruka Holdings (Pvt) Ltd:<br />
            <a
              href="mailto:colombo.office@kapruka.com"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
              style={{ color: "var(--purple-light)" }}
            >
              colombo.office@kapruka.com
            </a>
            <br />
            147 Old Kottawa Road, Nugegoda 10250, Sri Lanka
          </p>
        </Section>

      </div>

      <Footer />

    </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <p className="text-[15px] font-semibold text-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--purple-light)" }} />
      <span>{children}</span>
    </li>
  );
}
