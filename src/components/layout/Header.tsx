"use client";

import { ShoppingCart, Package, History, SquarePen, Sun, Moon, Users, UserRound, LogOut, ChevronDown, Loader2, MapPin, Languages, Coins, MoreHorizontal } from "lucide-react";
import { KiyoAvatar } from "@/components/ui/KiyoAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { useCartStore } from "@/features/cart/store";
import { useOrdersStore } from "@/features/orders/store";
import { useHistoryStore } from "@/features/history/store";
import { useRecipientsStore } from "@/features/recipients/store";
import { useAddressesStore } from "@/features/addresses/store";
import { useChatStore } from "@/features/chat/store";
import { useChat } from "@/features/chat/hooks/useChat";
import { useThemeStore, syncThemeFromDom } from "@/features/theme/store";
import { useCustomerStore } from "@/features/customer/store";
import { useShopStore } from "@/features/shop/store";
import type { Locale } from "@/types/domain";

const LANGUAGE_OPTIONS: Array<{ value: Locale; label: string; native: string }> = [
  { value: "en", label: "English", native: "English" },
  { value: "si", label: "Sinhala", native: "සිංහල" },
  { value: "ta-Latn", label: "Tamil (Latin)", native: "Tanglish" },
];

const CURRENCY_OPTIONS = ["LKR", "USD", "GBP", "AUD", "CAD", "EUR"] as const;

// Mobile MoreMenu rows are single-tap toggles rather than full dropdowns —
// cycle to the next option each tap instead of opening a nested picker.
function nextLocale(current: Locale | null): Locale {
  const values = LANGUAGE_OPTIONS.map((o) => o.value);
  const idx = current ? values.indexOf(current) : -1;
  return values[(idx + 1) % values.length];
}

function nextCurrency(current: string | null): string {
  const idx = current ? CURRENCY_OPTIONS.indexOf(current as (typeof CURRENCY_OPTIONS)[number]) : -1;
  return CURRENCY_OPTIONS[(idx + 1) % CURRENCY_OPTIONS.length];
}

// Generic small dropdown popover — mirrors AccountControl's open/close +
// click-outside behavior, reused for language and currency pickers.
function HeaderDropdown<T extends string>({
  icon,
  label,
  caption,
  value,
  triggerLabel,
  options,
  renderOption,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  caption?: string;
  value: T | null;
  triggerLabel: string;
  options: readonly T[];
  renderOption: (option: T) => ReactNode;
  onSelect: (option: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={label}
            className="flex items-center gap-1.5 rounded-xl px-2.5 h-9 text-[12px] font-medium transition-all hover:-translate-y-px active:scale-95"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
          >
            {icon}
            <span className="hidden sm:inline">{triggerLabel}</span>
            <ChevronDown className="h-3 w-3 hidden sm:inline" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>

      {open && (
        <div
          className="anim-fade-up absolute right-0 top-11 z-50 w-44 rounded-2xl p-1.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border-2)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
        >
          {caption && (
            <div className="px-2.5 pt-1 pb-1.5 text-[10px] leading-snug" style={{ color: "var(--ink-3)" }}>
              {caption}
            </div>
          )}
          {options.map((option) => (
            <button
              key={option}
              onClick={() => { onSelect(option); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[12px] text-left transition-colors"
              style={{
                color: option === value ? "var(--ink)" : "var(--ink-2)",
                background: option === value ? "var(--surface-2)" : "transparent",
                fontWeight: option === value ? 600 : 500,
              }}
            >
              {renderOption(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageControl() {
  const preferredLocale = useShopStore((s) => s.preferredLocale);
  const setPreferredLocale = useShopStore((s) => s.setPreferredLocale);
  const current = LANGUAGE_OPTIONS.find((o) => o.value === preferredLocale);

  return (
    <HeaderDropdown
      icon={<Languages className="h-3.5 w-3.5" />}
      label="Kiyo's reply language"
      caption="Changes the language Kiyo replies in — the rest of the app stays in English."
      value={preferredLocale}
      triggerLabel={current?.native ?? "Language"}
      options={LANGUAGE_OPTIONS.map((o) => o.value)}
      renderOption={(value) => {
        const option = LANGUAGE_OPTIONS.find((o) => o.value === value)!;
        return (
          <>
            <span>{option.native}</span>
            {option.native !== option.label && (
              <span style={{ color: "var(--ink-3)" }}>{option.label}</span>
            )}
          </>
        );
      }}
      onSelect={setPreferredLocale}
    />
  );
}

function CurrencyControl() {
  const preferredCurrency = useShopStore((s) => s.preferredCurrency);
  const setPreferredCurrency = useShopStore((s) => s.setPreferredCurrency);

  return (
    <HeaderDropdown
      icon={<Coins className="h-3.5 w-3.5" />}
      label="Currency"
      value={preferredCurrency}
      triggerLabel={preferredCurrency ?? "Currency"}
      options={CURRENCY_OPTIONS}
      renderOption={(value) => <span>{value}</span>}
      onSelect={setPreferredCurrency}
    />
  );
}

interface MoreMenuItem {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  count?: number;
  badgeColor?: string;
}

// Mobile-only overflow menu — the full button row (theme, language, currency,
// new chat, history, recipients, addresses) doesn't fit on narrow screens, so
// these collapse in here; Account/Orders/Cart stay directly visible since
// those are the actions people reach for most.
function MoreMenu({ items }: { items: MoreMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const totalCount = items.reduce((sum, i) => sum + (i.count ?? 0), 0);

  return (
    <div className="relative sm:hidden" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
        style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
      >
        <MoreHorizontal className="h-4 w-4" />
        {totalCount > 0 && (
          <span className="badge-count" style={{ background: "var(--purple)" }}>
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="anim-fade-up absolute right-0 top-11 z-50 w-56 rounded-2xl p-1.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border-2)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => { item.onClick(); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[12px] text-left transition-colors"
              style={{ color: "var(--ink-2)" }}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              {!!item.count && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-semibold text-white"
                  style={{ background: item.badgeColor ?? "var(--purple)" }}
                >
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountControl() {
  const account = useCustomerStore((s) => s.account);
  const status = useCustomerStore((s) => s.status);
  const error = useCustomerStore((s) => s.error);
  const logout = useCustomerStore((s) => s.logout);
  const sendMessage = useShopStore((s) => s.sendMessage);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Reopen the popover automatically when a lookup fails, even if the user
  // navigated away from it while waiting — otherwise the error is invisible.
  useEffect(() => {
    if (status === "error") setOpen(true); 
  }, [status]);

  function submitEmail() {
    const trimmed = emailDraft.trim();
    if (!trimmed || !sendMessage) return;
    sendMessage(`My email is ${trimmed} — can you pull up my account?`);
    router.push("/");
    setOpen(false);
  }

  const firstName = account?.profile.name?.split(" ")[0];

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={account ? `Signed in as ${account.profile.name}` : "Sign in"}
            className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 h-9 text-[12px] font-medium transition-all hover:-translate-y-px active:scale-95"
            style={{ border: "1px solid var(--border-2)", color: account ? "var(--ink)" : "var(--ink-2)" }}
          >
            {status === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserRound className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {status === "loading" ? "Signing in…" : account ? `Hi, ${firstName}` : "Sign in"}
            </span>
            <ChevronDown className="h-3 w-3 hidden sm:inline" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{account ? `Signed in as ${account.profile.name}` : "Sign in for faster checkout"}</TooltipContent>
      </Tooltip>

      {open && (
        <div
          className="anim-fade-up absolute right-0 top-11 z-50 w-64 rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border-2)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
        >
          {account ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>{account.profile.name}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--ink-3)" }}>{account.email}</p>
              </div>
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="flex items-center gap-1.5 text-[12px] font-medium self-start"
                style={{ color: "var(--ink-2)" }}
              >
                <LogOut className="h-3.5 w-3.5" /> Log out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium" style={{ color: "var(--ink)" }}>Sign in with your email</p>
              <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                We&apos;ll pull up your name, past orders, and saved addresses.
              </p>
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitEmail(); }}
                placeholder="you@example.com"
                autoFocus
                className="rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
              />
              {status === "error" && (
                <p className="text-[11px]" style={{ color: "var(--ink-2)" }}>
                  {error === "No account found for this email"
                    ? "We couldn't find an account for that email — double-check it or try another."
                    : error ?? "Something went wrong looking up that account. Please try again."}
                </p>
              )}
              <button
                onClick={submitEmail}
                disabled={!emailDraft.trim()}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-opacity disabled:opacity-40"
                style={{ background: "var(--gold)", color: "var(--surface)" }}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const toggleCart = useCartStore((s) => s.toggle);
  const cartItems = useCartStore((s) => s.items);

  const toggleOrders = useOrdersStore((s) => s.toggle);
  const pendingOrders = useOrdersStore((s) => s.pending);
  const trackedOrders = useOrdersStore((s) => s.tracked);

  const toggleHistory = useHistoryStore((s) => s.toggle);
  const historySessions = useHistoryStore((s) => s.sessions);

  const toggleRecipients = useRecipientsStore((s) => s.toggle);
  const recipients = useRecipientsStore((s) => s.recipients);

  const toggleAddresses = useAddressesStore((s) => s.toggle);
  const account = useCustomerStore((s) => s.account);

  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const { newChat, isStreaming } = useChat();
  const router = useRouter();

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const preferredLocale = useShopStore((s) => s.preferredLocale);
  const setPreferredLocale = useShopStore((s) => s.setPreferredLocale);
  const preferredCurrency = useShopStore((s) => s.preferredCurrency);
  const setPreferredCurrency = useShopStore((s) => s.setPreferredCurrency);

  function goHome() {
    newChat();
    router.push("/");
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    syncThemeFromDom();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const cartCount = mounted ? cartItems.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const ordersCount = mounted ? pendingOrders.length + trackedOrders.length : 0;
  const historyCount = mounted ? historySessions.length : 0;
  const recipientsCount = mounted ? recipients.length : 0;

  return (
    <header
      className="fixed inset-x-0 top-0 z-70 px-4 sm:px-6 lg:px-10"
      style={{ background: "transparent", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
    >
      <div className="flex h-16 items-center justify-between">
        <button
          onClick={goHome}
          className="flex items-center gap-3 cursor-pointer text-left w-auto"
          aria-label="Go to home"
        >
          <KiyoAvatar size={36} />
          <div className="flex flex-col justify-center">
            <span className="text-[15px] font-bold leading-tight tracking-tight text-foreground">
              <span className="font-kiyo">KI<span className="gradient-text">YO</span></span>
            </span>
            <span className="hidden sm:block text-[11px] leading-tight text-muted-foreground">
              Your AI shopping assistant
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Theme, language, currency, new chat, history, recipients, addresses —
              inline on sm+, collapsed into MoreMenu below on mobile */}
          <div className="hidden sm:contents">
            {/* Theme toggle */}
            {mounted && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                    style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Language + currency preference — session-scoped, available to guests too */}
            {mounted && <LanguageControl />}
            {mounted && <CurrencyControl />}

            {/* New chat — only visible when a conversation is active */}
            {mounted && hasMessages && (
              <button
                onClick={newChat}
                disabled={isStreaming}
                title="New chat"
                aria-label="New chat"
                className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 h-9 text-[12px] font-medium transition-all hover:-translate-y-px active:scale-95 disabled:opacity-40"
                style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
              >
                <SquarePen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New chat</span>
              </button>
            )}

            {/* History button */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleHistory}
                    aria-label="Chat history"
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                    style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                  >
                    <History className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Chat history</TooltipContent>
              </Tooltip>
              {historyCount > 0 && (
                <span className="badge-count" style={{ background: "var(--purple)" }}>
                  {historyCount}
                </span>
              )}
            </div>

            {/* Recipients button */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleRecipients}
                    aria-label="Saved recipients"
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                    style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                  >
                    <Users className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Saved recipients</TooltipContent>
              </Tooltip>
              {recipientsCount > 0 && (
                <span className="badge-count" style={{ background: "var(--purple)" }}>
                  {recipientsCount}
                </span>
              )}
            </div>

            {/* Addresses button — only shown once a user has onboarded */}
            {mounted && account && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleAddresses}
                    aria-label="Saved addresses"
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                    style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Saved addresses</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Mobile-only overflow menu for everything collapsed above */}
          {mounted && (
            <MoreMenu
              items={[
                {
                  key: "theme",
                  icon: theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />,
                  label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
                  onClick: toggleTheme,
                },
                {
                  key: "language",
                  icon: <Languages className="h-3.5 w-3.5" />,
                  label: `Kiyo's language: ${LANGUAGE_OPTIONS.find((o) => o.value === preferredLocale)?.native ?? "English"}`,
                  onClick: () => setPreferredLocale(nextLocale(preferredLocale)),
                },
                {
                  key: "currency",
                  icon: <Coins className="h-3.5 w-3.5" />,
                  label: `Currency: ${preferredCurrency ?? "LKR"}`,
                  onClick: () => setPreferredCurrency(nextCurrency(preferredCurrency)),
                },
                ...(hasMessages
                  ? [{ key: "newChat", icon: <SquarePen className="h-3.5 w-3.5" />, label: "New chat", onClick: newChat }]
                  : []),
                { key: "history", icon: <History className="h-3.5 w-3.5" />, label: "Chat history", onClick: toggleHistory, count: historyCount, badgeColor: "var(--purple)" },
                { key: "recipients", icon: <Users className="h-3.5 w-3.5" />, label: "Saved recipients", onClick: toggleRecipients, count: recipientsCount, badgeColor: "var(--purple)" },
                ...(account
                  ? [{ key: "addresses", icon: <MapPin className="h-3.5 w-3.5" />, label: "Saved addresses", onClick: toggleAddresses }]
                  : []),
              ]}
            />
          )}

          {/* Account — sign in / onboarded user indicator */}
          {mounted && <AccountControl />}

          {/* Orders button */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleOrders}
                  aria-label="Your orders"
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <Package className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Your orders</TooltipContent>
            </Tooltip>
            {ordersCount > 0 && (
              <span className="badge-count" style={{ background: "var(--gold)" }}>
                {ordersCount}
              </span>
            )}
          </div>

          {/* Cart button */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleCart}
                  aria-label="Open cart"
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Cart</TooltipContent>
            </Tooltip>
            {cartCount > 0 && (
              <span className="badge-count">{cartCount > 99 ? "99+" : cartCount}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
