"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Users, Trash2, Pencil, Check, MapPin, Phone, Sparkles, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRecipientsStore } from "@/features/recipients/store";
import type { SavedRecipient } from "@/features/recipients/store";
import { useShopStore } from "@/features/shop/store";
import { usePanelEscape } from "@/lib/hooks/usePanelEscape";

function RecipientRow({ saved, onRemove, onRename, onUse }: {
  saved: SavedRecipient;
  onRemove: () => void;
  onRename: (label: string) => void;
  onUse: () => void;
}) {
  const { recipient } = saved;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved.label);

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div
      className="group rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
    >
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 min-w-0 rounded-lg px-2 py-1 text-[13px] font-semibold outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
              autoFocus
            />
            <button onClick={commitRename} aria-label="Save label" style={{ color: "var(--purple-light)" }}>
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{saved.label}</p>
        )}

        <div className="flex items-center gap-1 opacity-100 transition-opacity shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {!editing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setEditing(true)} style={{ color: "var(--ink-3)" }} aria-label="Rename">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onRemove} style={{ color: "var(--ink-3)" }} aria-label="Remove recipient">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Remove</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[12px]" style={{ color: "var(--ink-2)" }}>
        <span>{recipient.name}</span>
        <span className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 shrink-0" style={{ color: "var(--ink-3)" }} />
          {recipient.phone}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--ink-3)" }} />
          {recipient.address}, {recipient.city}
        </span>
      </div>

      <button
        onClick={onUse}
        className="flex items-center gap-1.5 text-[11px] font-medium underline-offset-2 hover:underline transition-colors text-left self-start"
        style={{ color: "var(--purple-light)" }}
      >
        <Send className="h-3.5 w-3.5" /> Use for this order
      </button>
    </div>
  );
}

function RecipientsPanelContent({ onClose }: { onClose: () => void }) {
  const recipients = useRecipientsStore((s) => s.recipients);
  const removeRecipient = useRecipientsStore((s) => s.removeRecipient);
  const renameRecipient = useRecipientsStore((s) => s.renameRecipient);
  const sendMessage = useShopStore((s) => s.sendMessage);
  const router = useRouter();

  usePanelEscape(true, onClose);

  function handleUse(saved: SavedRecipient) {
    if (!sendMessage) return;
    const { recipient } = saved;
    onClose();
    sendMessage(
      `I want to send this to ${recipient.name} again [recipient:${recipient.name}|${recipient.phone}|${recipient.address}|${recipient.city}]. Please use these details for delivery.`
    );
    router.push("/");
  }

  return (
    <>
      <div className="backdrop" onClick={onClose} style={{ zIndex: 70 }} />

      <aside role="dialog" aria-modal="true" aria-label="Recipients" className="cart-panel glass-dark anim-slide-left flex flex-col" style={{ zIndex: 80 }}>
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-2)" }}
        >
          <div>
            <h2 className="t-title" style={{ color: "var(--ink)" }}>Saved Recipients</h2>
            <p className="t-small mt-0.5" style={{ color: "var(--ink-2)" }}>
              {recipients.length === 0 ? "No saved recipients" : `${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                aria-label="Close recipients"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95"
                style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          {recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--surface-2)" }}
              >
                <Users className="h-7 w-7" style={{ color: "var(--ink-3)" }} />
              </div>
              <div>
                <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>No saved recipients yet</p>
                <p className="t-small mt-1 max-w-55" style={{ color: "var(--ink-2)" }}>
                  After an order is confirmed, you can save the recipient here for faster checkout next time.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recipients.map((saved) => (
                <RecipientRow
                  key={saved.id}
                  saved={saved}
                  onRemove={() => removeRecipient(saved.id)}
                  onRename={(label) => renameRecipient(saved.id, label)}
                  onUse={() => handleUse(saved)}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border-2)" }}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--purple-light)" }} />
          <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
            Tap &ldquo;Use for this order&rdquo; on a saved recipient to reuse their details in chat
          </p>
        </div>
      </aside>
    </>
  );
}

export function RecipientsPanel() {
  const isOpen = useRecipientsStore((s) => s.isOpen);
  const close = useRecipientsStore((s) => s.close);
  if (!isOpen) return null;
  return <RecipientsPanelContent onClose={close} />;
}
