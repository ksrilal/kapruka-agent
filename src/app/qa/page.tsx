import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata = {
  title: "Q&A — Kiyo Help",
  description: "Common questions about Kiyo, Kapruka deliveries, payments, and order tracking.",
};

const SECTIONS = [
  {
    heading: "Getting Started",
    items: [
      {
        q: "What is KIYO?",
        a: <><span className="font-kiyo">KI<span className="gradient-text">YO</span></span> is a conversational AI shopping assistant powered by Kapruka. You describe what you want — a birthday cake, flowers for a parent, or a gift for a child — and <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> finds the right products, checks delivery availability, and guides you through checkout, all in one chat.</>,
      },
      {
        q: "What languages does KIYO understand?",
        a: <><span className="font-kiyo">KI<span className="gradient-text">YO</span></span> understands English, Sinhala (සිංහල), Tamil (தமிழ்), and Tanglish — Sinhala or Tamil typed out in everyday Latin letters, the way most Sri Lankans actually text (e.g. &ldquo;mage ammata gift ekak ona&rdquo;). Just type naturally in whichever style feels comfortable — <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will match it.</>,
      },
      {
        q: "Do I need to create an account?",
        a: <>No. <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> and Kapruka both support guest checkout. Just provide a delivery address and your contact details when placing an order — no registration required.</>,
      },
      {
        q: "Why does KIYO ask me questions instead of just showing products?",
        a: <>For anything with real ambiguity — an emotional moment, a big occasion, an unclear budget or relationship — <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> asks a quick question first so the recommendation actually fits, instead of guessing. For clear, functional requests (&ldquo;show me laptops&rdquo;, &ldquo;deliver to Kandy tomorrow?&rdquo;) <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> skips straight to results.</>,
      },
    ],
  },
  {
    heading: "Orders & Delivery",
    items: [
      {
        q: "Which cities does Kapruka deliver to?",
        a: <>Kapruka delivers island-wide across Sri Lanka, including major cities like Colombo, Kandy, Galle, Jaffna, Matara, and Kurunegala. Coverage and delivery timing can vary by location — just tell <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> the destination city and it&apos;ll check live availability, delivery dates, and any charges for you.</>,
      },
      {
        q: "Can I send a gift from overseas?",
        a: "Yes. Many Kapruka customers are Sri Lankans living abroad who send gifts to family back home. You can complete the entire order and payment process from anywhere in the world.",
      },
      {
        q: "How quickly will my order arrive?",
        a: <>Delivery times depend on the product and destination. Many items in Colombo and major cities are available for same-day delivery if ordered before the cutoff time. <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will show estimated delivery windows for each product.</>,
      },
      {
        q: "Can I track my order?",
        a: <>Yes. Once your order is placed, you can ask <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> to track it using your order ID. <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will return the current status directly in the chat.</>,
      },
    ],
  },
  {
    heading: "Payments",
    items: [
      {
        q: "How do I pay?",
        a: <>After confirming your order, <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> generates a secure Kapruka payment link. You&apos;ll be redirected to Kapruka&apos;s checkout page where you can pay by card, online banking, or other methods supported by Kapruka.</>,
      },
      {
        q: "Are prices in LKR?",
        a: <>Yes. All prices shown by <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> are in Sri Lankan Rupees (LKR). If you&apos;re ordering from overseas, your bank or card provider will handle the currency conversion.</>,
      },
      {
        q: "How long is a payment link valid?",
        a: <>Payment links expire after 60 minutes. If your link expires before payment, simply ask <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> to create a new order.</>,
      },
    ],
  },
  {
    heading: "Products",
    items: [
      {
        q: "What kinds of products can I order?",
        a: <><span className="font-kiyo">KI<span className="gradient-text">YO</span></span> has access to Kapruka&apos;s full catalogue — not just gifts. Cakes, flowers, gift hampers, chocolates, toys, jewellery, electronics, groceries, fashion, home essentials, office supplies, beauty, and sports gear are all in scope. Just describe what you&apos;re looking for and <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will surface the best matches.</>,
      },
      {
        q: "Can I ask for products in a specific price range?",
        a: <>Absolutely. You can say things like &ldquo;birthday cake under LKR 3,000&rdquo; or &ldquo;gift hamper between 2,000 and 5,000&rdquo; and <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will filter results accordingly.</>,
      },
      {
        q: "What if a product I want isn't available?",
        a: <><span className="font-kiyo">KI<span className="gradient-text">YO</span></span> only shows products that are currently in stock. If something isn&apos;t available, <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will suggest alternatives from the same category.</>,
      },
      {
        q: "Can I browse by category instead of searching?",
        a: "Yes. Tap the category browser to scroll through Kapruka's categories — Cakes, Flowers, Gifts, Chocolates, Toys, Jewellery, Electronics, Fashion, Combo Gift Packs, Clothing, Food & Restaurants, Fruit Baskets, and more — or type to filter the list, then tap one to see what's available.",
      },
      {
        q: "Can I see prices in a currency other than LKR?",
        a: <>Yes. Just ask — &ldquo;show me this in USD&rdquo; or &ldquo;what&apos;s the price in GBP?&rdquo; — and <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> will keep quoting in that currency (LKR, USD, GBP, AUD, CAD, or EUR) for the rest of the session. Note that delivery fees are always shown in LKR regardless of the currency you choose.</>,
      },
      {
        q: "Can I add a message to a cake or gift?",
        a: <>Yes. For cakes, <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> can add custom icing text. For any order, you can include a gift card message, and choose to send it under your name or anonymously.</>,
      },
    ],
  },
  {
    heading: "Cart & Buy Now",
    items: [
      {
        q: "Is there a cart, or do I have to order everything through chat?",
        a: <>Both. You can ask <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> to add items to your cart as you go, then review and check out from the cart panel — or tap &ldquo;Buy Now&rdquo; on any product card to jump straight into ordering that item in chat.</>,
      },
      {
        q: "Does my cart stay saved if I close the tab?",
        a: "Your cart is kept for your current browser tab session — it clears when you close the tab. It's meant for the shopping session you're actively in, not long-term storage.",
      },
    ],
  },
  {
    heading: "Chat History",
    items: [
      {
        q: "Does KIYO remember my past conversations?",
        a: <><span className="font-kiyo">KI<span className="gradient-text">YO</span></span> keeps your recent chat sessions saved in your browser (the last few), so you can reopen the history panel and pick up a previous conversation where you left off.</>,
      },
      {
        q: "What are the suggestion bubbles on the home screen?",
        a: <><span className="font-kiyo">KI<span className="gradient-text">YO</span></span> shows short, personalized suggestions based on your cart, recent orders, and past chats. Tapping a fresh suggestion starts a new conversation with that idea; tapping one tied to a past chat reopens that exact conversation instead.</>,
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
        Back to <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>
      </Link>

      <div className="mb-10">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo size={400} />
        </div>
        <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: "var(--purple-light)" }}>
          Help
        </p>
        <h1 className="text-[32px] font-bold leading-tight text-foreground mb-4">
          Questions &amp; Answers
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Everything you need to know about <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> and ordering through Kapruka.
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
          You can ask <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> directly in the chat, or reach out to Kapruka support.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl px-5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--purple)" }}
          >
            Ask <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>
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
