"use client";

import { useEffect } from "react";
import { X, MapPin, RefreshCw, Loader2, Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAddressesStore } from "@/features/addresses/store";
import { useCustomerStore } from "@/features/customer/store";
import { usePanelEscape } from "@/lib/hooks/usePanelEscape";

function AddressRow({ address }: { address: { recipient_name: string; address: string; city: string; phone?: string; label?: string } }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--purple-soft)" }}
        >
          <MapPin className="h-3.5 w-3.5" style={{ color: "var(--purple-light)" }} />
        </div>
        <p className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
          {address.recipient_name}
          {address.label && (
            <span className="ml-2 text-[10px] font-normal" style={{ color: "var(--ink-3)" }}>
              {address.label}
            </span>
          )}
        </p>
      </div>
      <p className="text-[11px]" style={{ color: "var(--ink-2)" }}>
        {address.address}, {address.city}
      </p>
      {address.phone && (
        <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
          <Phone className="h-3 w-3" /> {address.phone}
        </p>
      )}
    </div>
  );
}

// Inner component — only mounted when the panel is open, so the fetch only
// runs while the user has the panel visible. Always pulls fresh from MCP,
// never trusts the account snapshot cached at login.
function AddressesPanelContent({ onClose }: { onClose: () => void }) {
  const addresses = useAddressesStore((s) => s.addresses);
  const status = useAddressesStore((s) => s.status);
  const error = useAddressesStore((s) => s.error);
  const fetchAddresses = useAddressesStore((s) => s.fetchAddresses);
  const account = useCustomerStore((s) => s.account);

  const email = account?.email;

  useEffect(() => {
    if (email) void fetchAddresses(email);
  }, [email, fetchAddresses]);
  usePanelEscape(true, onClose);

  const loading = status === "loading";

  return (
    <>
      <div className="backdrop" onClick={onClose} style={{ zIndex: 70 }} />

      <aside role="dialog" aria-modal="true" aria-label="Saved Addresses" className="cart-panel glass-dark anim-slide-left flex flex-col" style={{ zIndex: 80 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-2)" }}
        >
          <div>
            <h2 className="t-title" style={{ color: "var(--ink)" }}>Saved Addresses</h2>
            <p className="t-small mt-0.5" style={{ color: "var(--ink-2)" }}>
              {loading
                ? "Loading…"
                : addresses.length === 0
                  ? "No saved addresses"
                  : `${addresses.length} address${addresses.length !== 1 ? "es" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => email && void fetchAddresses(email)}
                  disabled={loading || !email}
                  aria-label="Refresh addresses"
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95 disabled:opacity-40"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  aria-label="Close addresses"
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar flex flex-col gap-3">
          {loading && addresses.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--ink-3)" }} />
              <p className="t-small" style={{ color: "var(--ink-2)" }}>Fetching your addresses…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>Couldn&apos;t load addresses</p>
              <p className="t-small" style={{ color: "var(--ink-2)" }}>{error}</p>
            </div>
          )}

          {!loading && !error && addresses.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--surface-2)" }}
              >
                <MapPin className="h-7 w-7" style={{ color: "var(--ink-3)" }} />
              </div>
              <div>
                <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>No saved addresses yet</p>
                <p className="t-small mt-1" style={{ color: "var(--ink-2)" }}>
                  Addresses you&apos;ve used before will appear here.
                </p>
              </div>
            </div>
          )}

          {!error && addresses.length > 0 && (
            <div className="flex flex-col gap-3">
              {addresses.map((a, i) => (
                <AddressRow key={`${a.recipient_name}-${a.address}-${i}`} address={a} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function AddressesPanel() {
  const isOpen = useAddressesStore((s) => s.isOpen);
  const close = useAddressesStore((s) => s.close);
  if (!isOpen) return null;
  return <AddressesPanelContent onClose={close} />;
}
