# KIYO User Manual

KIYO is a conversational shopping assistant for Kapruka. Instead of browsing category pages and filters, you talk to KIYO — by typing or speaking, in English, Sinhala, or Tanglish (Sinhala/Tamil typed in Latin letters) — and it finds products, checks delivery, builds your order, and hands you off to Kapruka's secure payment page. No account or password is required; you can shop entirely as a guest, or sign in with just your email for a personalized experience.

Everything you do — cart, orders, saved recipients, chat history, theme, language, currency — is stored locally in your browser. There's no cloud sync, so clearing your browser data or switching devices/browsers will reset it.

---

## 1. Getting started — talking to KIYO

When you first land on the page, you'll see a large input box: **"Ask Kiyo anything..."** Type what you're looking for, in your own words and in whichever language is natural to you, e.g.:

- "Birthday cake for Kandy under LKR 10,000"
- "මට මල් මාලාවක් ඕනේ" (Sinhala)
- "Colombo deliver karanawada?" (Tanglish)

You can also tap the **microphone icon** to dictate your message instead of typing (only shown if your browser supports voice input).

Once you send your first message, the big input moves to a **command bar fixed at the bottom of the screen**. Press **Enter** to send, **Shift+Enter** for a new line, or press **Cmd/Ctrl+K** from anywhere on the page to jump back into the input.

While KIYO is working, you'll see a running checklist of what it's doing — e.g. "Searching Kapruka's catalog...", "Checking delivery availability..." — with checkmarks as each step finishes. If you want to cancel mid-reply, the send button turns into a **Stop** button.

A small language badge (EN / සිං / TGL) appears next to the input once you start chatting, showing which language KIYO detected you're using.

**Not sure what to ask?** On the home screen you'll find:
- A **"Shop by category"** row of quick-tap pills (Cakes, Flowers, Gifts, etc.) — tap one to send that query instantly. Tap the grid icon to expand a full category browser (31 categories, searchable).
- A **"Try asking"** row of example full sentences you can tap to send as-is.
- **KIYO Suggestions** — a column of speech bubbles with proactive prompts ("Need help comparing two products?", reminders about your cart, pending orders, or a chat you left off). On mobile, "Categories" and "Suggestions" appear as two tap-to-open panels instead of side rails.

---

## 2. Finding and buying products

When KIYO finds relevant items, they appear as a **grid of product cards** right in the chat reply — image, name, price (with a strikethrough original price and "-X%" badge if discounted), and an "Out of stock" badge if unavailable.

**Tap a card** to reveal three actions:
- **Kapruka** — opens the live product page on kapruka.com in a new tab.
- **Add to Cart** — adds it to your in-app cart and opens the Cart panel.
- **Buy Now** — skips the cart and asks KIYO to place an order for just that item right away.

A small cart icon on a card's corner shows it's already in your cart.

---

## 3. Cart & checkout

Open the cart via the **cart icon** in the header (it shows an item-count badge). Here you can adjust quantities, remove items, and — for cakes — add an optional message for the icing (40 characters max). If you have more than one item, each line also has an "Order this" option to check out that item alone.

Tapping **"Checkout with KIYO"** doesn't complete the order immediately — it sends your cart summary into the chat, and KIYO guides you conversationally through delivery details and payment.

Once KIYO has everything it needs, it returns an **Order Card** right in the chat with an order reference, a **60-minute countdown** before the link expires, the total, and a **Pay Now** button that opens Kapruka's secure payment page in a new tab. This order is also saved automatically to your **Orders** panel under "Pending Payment."

---

## 4. Orders

Open via the **package icon** in the header.

**Pending Payment** — orders awaiting payment, with a live countdown and a **Pay Now** button (disabled once expired). If you've already paid, expand **"Already paid? Enter your order number →"**, paste the order number from your confirmation email, and tap **Track** to move it into Tracked Orders.

**Tracked Orders** — confirmed orders with a status badge (Shipped, Delivered, Cancelled, etc.), recipient, city, delivery date, amount, and a short progress timeline. Status refreshes automatically every 15 minutes while the panel is open, or tap the refresh icon to check now. You can also:
- **Reorder** — re-add the same items to your cart (KIYO re-checks that delivery to that city is still available).
- **Send again** — re-confirms price/stock in chat and starts a fresh order to the same recipient.
- **Save recipient** — save that delivery contact for next time.

---

## 5. Saved recipients & addresses

**Saved Recipients** (people icon in header) — people you've sent orders to before. Tap **"Use for this order"** on any saved recipient to start a new order to them without retyping their details. You can rename or delete saved recipients.

**Saved Addresses** (map-pin icon) — only appears once you've **signed in**. Shows the address book from your real Kapruka account, refreshed live each time you open it. This is read-only; use Recipients to actually reuse an address in an order.

---

## 6. Signing in (optional)

There's no password or registration — signing in just means letting KIYO look up your existing Kapruka account by email.

Click **"Sign in"** in the top-right of the header, or simply tell KIYO your email in chat (e.g. "My email is you@example.com"). Either way, KIYO looks up your account.

**If found:** KIYO greets you by name, and:
- The header switches to **"Hi, [Name]"**.
- The **Addresses** panel becomes available.
- Your past orders are pulled in and the Orders panel opens automatically.
- Your saved addresses populate the Recipients panel.
- Home-screen suggestions become personalized (e.g. "Welcome back — want to reorder [item]?").

**If not found:** you'll see "We couldn't find an account for that email" — you can double-check the email or simply continue as a guest. (Note: account sign-in is currently in limited rollout, so not every real Kapruka customer will be recognized yet — this isn't necessarily a typo on your part.)

**Signing out:** open the account popover and tap **Log out**. Your current conversation is saved to that account's own history first, then you're returned to a fresh guest session. Guest data and each signed-in account's data (cart, orders, recipients, history) are kept completely separate and never mixed.

---

## 7. Chat history

Open via the **history/clock icon** in the header. Every past conversation is saved as a card (title, preview, time ago, message count) — tap one to restore it into the active chat. KIYO automatically saves your current conversation whenever you start a new chat or sign in/out.

You can delete individual sessions or use **"Clear all"**. KIYO keeps your **20 most recent sessions**.

---

## 8. Language, currency, and theme

- **Language** (globe icon) — English, Sinhala (සිංහල), or Tamil in Latin script ("Tanglish"). This only changes the language KIYO replies in — the rest of the app's UI stays in English. If you don't set it manually, KIYO auto-matches whichever language you type in per message.
- **Currency** (coin icon) — LKR, USD, GBP, AUD, CAD, or EUR for displayed prices. Actual payment is always settled in LKR at checkout; other currencies are a convenience display only.
- **Theme** (sun/moon icon) — toggles dark/light mode instantly; your choice is remembered for next time.

On mobile, these three controls collapse into a **"More"** overflow menu, along with New Chat, History, Recipients, and Addresses.

---

## 9. Header at a glance

| Icon | What it does |
|---|---|
| KIYO logo | Go home and start a fresh chat |
| Sun/Moon | Toggle dark/light theme |
| Language | Switch KIYO's reply language |
| Currency | Switch displayed price currency |
| New chat (pencil) | Save current chat to history, start fresh |
| History (clock) | Open chat history |
| Recipients (people) | Open saved recipients |
| Addresses (map-pin) | Open saved addresses *(signed-in only)* |
| More (•••) | Overflow menu, mobile only |
| Orders (package) | Open pending/tracked orders |
| Cart | Open your cart |
| Account | Sign in, or view/log out of your account |

---

## 10. Good to know

- **Voice input** requires a browser with speech-recognition support (e.g. Chrome); it's hidden automatically if unsupported. KIYO doesn't speak replies out loud — text only.
- **Payment links expire after 60 minutes.**
- **Everything is stored locally in your browser** — cart, orders, recipients, history, and preferences. Clearing browser data or switching browsers/devices starts you fresh.
- If you're chatting a lot in a short period, you may occasionally see a "Kapruka is a bit busy right now — please try again in a moment" message — this is a brief rate limit, not an error with your request.
