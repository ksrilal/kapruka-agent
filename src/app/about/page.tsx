import Link from "next/link";
import { ArrowLeft, Sparkles, MapPin, Heart, Zap, Shield, Globe } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "About Kiyo — Sri Lanka's Smartest Shopping Assistant",
  description: "Learn how Kiyo is reimagining online shopping in Sri Lanka through conversational AI powered by Kapruka.",
};

const PILLARS = [
  {
    icon: Sparkles,
    color: "var(--purple-light)",
    bg: "var(--purple-soft)",
    title: "Conversational Commerce",
    body: <>Forget rigid search filters and endless category browsing. Just tell <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> what you need — in English, Sinhala, Singlish, or Tanglish — and get curated results in seconds.</>,
  },
  {
    icon: MapPin,
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    title: "Delivery Across Sri Lanka",
    body: <>Powered by Kapruka&apos;s island-wide logistics network, <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> can dispatch gifts, flowers, cakes, and more across Sri Lanka — just name the destination city and <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> checks live delivery availability and timing for you.</>,
  },
  {
    icon: Heart,
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.12)",
    title: "Built for Real Gifting",
    body: <>Whether it&apos;s a birthday cake for a cousin in Kandy or a flower arrangement for a parent in Colombo, <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> understands the emotional context behind every order.</>,
  },
  {
    icon: Zap,
    color: "var(--gold)",
    bg: "var(--gold-soft)",
    title: "Instant, Expressive Checkout",
    body: <>From product discovery to payment in under two minutes. Add items to your cart as you chat, or tap Buy Now on any product to jump straight into ordering. <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> handles order creation and hands you a secure payment link — no account required.</>,
  },
  {
    icon: Globe,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    title: "Shop in Your Currency",
    body: <>Ask for prices in LKR, USD, GBP, AUD, CAD, or EUR and <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> keeps quoting in that currency for the rest of your session — handy for the Sri Lankan diaspora sending gifts home.</>,
  },
  {
    icon: Shield,
    color: "var(--accent)",
    bg: "var(--accent-soft)",
    title: "Trusted & Transparent",
    body: <>Real-time inventory, honest pricing in LKR, and live order tracking — <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> never shows you a product that isn&apos;t available or a price that can change at checkout.</>,
  },
  {
    icon: Sparkles,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    title: "Personalized, If You Want It",
    body: <>Shop entirely as a guest, or sign in with just your email — no password — to get a personalized experience: your past orders, saved addresses, and saved recipients pulled in automatically so reordering and sending to the same person again takes seconds.</>,
  },
];

export default function AboutPage() {
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

      {/* Hero */}
      <div className="mb-10">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo size={400} />
        </div>
        <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: "var(--purple-light)" }}>
          About
        </p>
        <h1 className="text-[32px] font-bold leading-tight text-foreground mb-4">
          Shopping that feels like<br />
          <span className="gradient-text">talking to a friend.</span>
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> is an AI shopping assistant built on top of{" "}
          <a
            href="https://www.kapruka.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
            style={{ color: "var(--purple-light)" }}
          >
            Kapruka
          </a>
          {" "}— Sri Lanka's largest online gifting and delivery platform. We believe the future of
          e-commerce isn't a better search box; it's a smarter conversation.
        </p>
      </div>

      {/* Pillars */}
      <div className="mb-12 flex flex-col gap-4">
        {PILLARS.map(({ icon: Icon, color, bg, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border p-5 flex gap-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: bg }}
            >
              <Icon className="h-4 w-4" style={{ color }} strokeWidth={2} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-foreground mb-1">{title}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kapruka */}
      <div
        className="rounded-2xl border p-6 mb-10"
        style={{ background: "var(--surface)", borderColor: "var(--glass-border)" }}
      >
        <p className="text-[12px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--ink-3)" }}>
          Powered by
        </p>
        <p className="text-[18px] font-bold text-foreground mb-2">Kapruka.com</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Since 2004, Kapruka has been connecting Sri Lankans at home and abroad with reliable,
          same-day gifting and delivery services. <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> is built on Kapruka&apos;s catalogue, payment
          infrastructure, and logistics — meaning every order you place is backed by two decades
          of local expertise.
        </p>
      </div>

      {/* Language */}
      <div className="mb-10">
        <p className="text-[14px] font-semibold text-foreground mb-3">Speak your language</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { lang: "English", example: "Send birthday cake to Colombo", color: "var(--ink-2)", bg: "var(--surface-2)" },
            { lang: "සිංහල", example: "අම්මාගේ උපන්දිනයට ලස්සන කේක් එකක් හොයලා දෙන්න", color: "var(--purple-light)", bg: "var(--purple-soft)" },
            { lang: "Singlish", example: "mage ammata birthday gift ekak ona", color: "var(--accent)", bg: "var(--accent-soft)" },
            { lang: "Tanglish", example: "en amma-ku birthday gift venum", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
          ].map(({ lang, example, color, bg }) => (
            <div
              key={lang}
              className="rounded-xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${color}33` }}
            >
              <p className="text-[12px] font-bold mb-1.5" style={{ color }}>{lang}</p>
              <p className="text-[11px] leading-snug" style={{ color: "var(--ink-3)" }}>&ldquo;{example}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border p-5 text-center" style={{ borderColor: "var(--border)" }}>
        <p className="text-[13px] mb-1" style={{ color: "var(--ink-2)" }}>
          Questions or feedback?
        </p>
        <a
          href="mailto:colombo.office@kapruka.com"
          className="text-[13px] font-medium underline underline-offset-2 transition-colors hover:text-foreground"
          style={{ color: "var(--purple-light)" }}
        >
          colombo.office@kapruka.com
        </a>
      </div>

      <Footer />

    </div>
    </div>
  );
}
