import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Q&A — Kiyo Help",
  description: "Common questions about Kiyo, Kapruka deliveries, payments, and order tracking.",
};

const SECTIONS = [
  {
    heading: "Getting Started",
    items: [
      {
        q: "What is Kiyo?",
        a: "Kiyo is a conversational AI shopping assistant powered by Kapruka. You describe what you want — a birthday cake, flowers for a parent, or a gift for a child — and Kiyo finds the right products, checks delivery availability, and guides you through checkout, all in one chat.",
      },
      {
        q: "What languages does Kiyo understand?",
        a: "Kiyo understands English, Sinhala (සිංහල), and Tanglish (a natural mix of Tamil and English). You can switch between languages mid-conversation — no need to restart.",
      },
      {
        q: "Do I need to create an account?",
        a: "No. Kiyo and Kapruka both support guest checkout. Just provide a delivery address and your contact details when placing an order — no registration required.",
      },
    ],
  },
  {
    heading: "Orders & Delivery",
    items: [
      {
        q: "Which cities does Kapruka deliver to?",
        a: "Kapruka delivers island-wide across Sri Lanka — over 300 cities and towns including Colombo, Kandy, Galle, Jaffna, Matara, Kurunegala, and more. You can ask Kiyo to check delivery availability for any specific location.",
      },
      {
        q: "Can I send a gift from overseas?",
        a: "Yes. Many Kapruka customers are Sri Lankans living abroad who send gifts to family back home. You can complete the entire order and payment process from anywhere in the world.",
      },
      {
        q: "How quickly will my order arrive?",
        a: "Delivery times depend on the product and destination. Many items in Colombo and major cities are available for same-day delivery if ordered before the cutoff time. Kiyo will show estimated delivery windows for each product.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Once your order is placed, you can ask Kiyo to track it using your order ID. Kiyo will return the current status directly in the chat.",
      },
    ],
  },
  {
    heading: "Payments",
    items: [
      {
        q: "How do I pay?",
        a: "After confirming your order, Kiyo generates a secure Kapruka payment link. You'll be redirected to Kapruka's checkout page where you can pay by card, online banking, or other methods supported by Kapruka.",
      },
      {
        q: "Are prices in LKR?",
        a: "Yes. All prices shown by Kiyo are in Sri Lankan Rupees (LKR). If you're ordering from overseas, your bank or card provider will handle the currency conversion.",
      },
      {
        q: "How long is a payment link valid?",
        a: "Payment links expire after 60 minutes. If your link expires before payment, simply ask Kiyo to create a new order.",
      },
    ],
  },
  {
    heading: "Products",
    items: [
      {
        q: "What kinds of products can I order?",
        a: "Kiyo has access to Kapruka's full catalogue — cakes, flowers, gift hampers, chocolates, toys, jewellery, electronics, fashion, and more. Just describe what you're looking for and Kiyo will surface the best matches.",
      },
      {
        q: "Can I ask for products in a specific price range?",
        a: "Absolutely. You can say things like \"birthday cake under LKR 3,000\" or \"gift hamper between 2,000 and 5,000\" and Kiyo will filter results accordingly.",
      },
      {
        q: "What if a product I want isn't available?",
        a: "Kiyo only shows products that are currently in stock. If something isn't available, Kiyo will suggest alternatives from the same category.",
      },
    ],
  },
];

export default function QAPage() {
  return (
    <div className="flex h-full w-full justify-center overflow-y-auto">
    <div className="mx-auto w-full max-w-2xl px-4 py-8 animate-fade-up">

      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-[13px] transition-colors"
        style={{ color: "var(--ink-3)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Kiyo
      </Link>

      <div className="mb-10">
        <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: "var(--purple-light)" }}>
          Help
        </p>
        <h1 className="text-[32px] font-bold leading-tight text-foreground mb-4">
          Questions &amp; Answers
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Everything you need to know about Kiyo and ordering through Kapruka.
        </p>
      </div>

      <div className="flex flex-col gap-10 mb-10">
        {SECTIONS.map(({ heading, items }) => (
          <div key={heading}>
            <p
              className="text-[11px] font-bold tracking-widest uppercase mb-4"
              style={{ color: "var(--ink-3)" }}
            >
              {heading}
            </p>
            <div className="flex flex-col gap-3">
              {items.map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-2xl border p-5"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[14px] font-semibold text-foreground mb-2">{q}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl border p-5 text-center"
        style={{ borderColor: "var(--glass-border)", background: "var(--surface)" }}
      >
        <p className="text-[14px] font-semibold text-foreground mb-1">Still have questions?</p>
        <p className="text-[13px] mb-3" style={{ color: "var(--ink-2)" }}>
          You can ask Kiyo directly in the chat, or reach out to Kapruka support.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl px-5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--purple)" }}
          >
            Ask Kiyo
          </Link>
          <a
            href="mailto:colombo.office@kapruka.com"
            className="rounded-xl border px-5 py-2 text-[13px] font-semibold transition-all hover:bg-card active:scale-95"
            style={{ borderColor: "var(--border)", color: "var(--ink-2)" }}
          >
            Email support
          </a>
        </div>
      </div>

    </div>
    </div>
  );
}
