# Claude Task — VSPx Chat Widget (Tier 3.1)

## Context

Port the VSPx floating chat widget — a draggable/resizable iframe panel that embeds
the Virtual Standardized Patient simulator. Students use this to practice patient
interviews during case work. The widget must preserve WebRTC call state across
minimize/expand cycles.

## Why Claude (not delegated)

This task requires:

- Complex stateful UI with drag/resize pointer event handling
- iframe lifecycle management (create, detach, reattach, destroy)
- Cross-component communication (eligibility depends on active case metadata)
- Access verification flow with API calls and sessionStorage caching
- Keyboard shortcuts (Alt+Shift+C toggle, Escape close)
- Mobile-responsive mode switching (panel → fullscreen)
- Real-time debugging and iteration

## Source files

Legacy (port FROM):
app/js/features/vspx-chat/vspx-chat.js — 400+ line widget with full lifecycle
app/css/components/vspx-chat.css — 411 lines of responsive styling

Integration points (read, minimal modifications):
src/routes/workspace/editor/+page.svelte — Where trigger button gets injected
src/lib/stores/cases.ts — activeCase store for eligibility check
src/lib/stores/auth.ts — Role checking for faculty config button

## Files to create

1. **src/lib/components/VspxChatWidget.svelte** — Main widget component
   - Floating panel with titlebar, iframe body, resize handles
   - States: idle (hidden), expanded (visible panel)
   - Drag via pointer events on titlebar
   - Resize via pointer events on corner handles
   - Minimize preserves iframe in memory (WebRTC continuity)
   - Close destroys iframe
   - Mobile: fullscreen overlay mode
   - Keyboard: Alt+Shift+C toggle, Escape minimize/close
   - Geometry persistence via sessionStorage
   - Entry/exit animations (scale + opacity)

2. **src/lib/components/VspxChatTrigger.svelte** — Header button component
   - "Call Patient" button injected in patient header
   - Green pulse animation when call active
   - Eligibility-gated: only shown when case has vspx enabled

3. **src/lib/services/vspxAccess.ts** — Access verification service
   - verifyFacultyAccessCode(caseId): Promise<boolean>
   - Checks sessionStorage cache first
   - Falls back to /api/verify-access POST
   - Handles: API unavailable (dev mode → allow), no codes → allow, codes required → prompt

4. **src/tests/vspx-chat.test.ts** — Unit tests for access service + eligibility logic

## Files to modify

1. **src/routes/workspace/editor/+page.svelte** — Add VspxChatWidget + VspxChatTrigger
   import and render conditionally based on case eligibility

## Key implementation details

### Eligibility check:

```typescript
const canUseVspx = $derived.by(() => {
  const caseObj = $activeCase.caseWrapper?.caseObj;
  if (!caseObj?.meta) return false;
  const isFaculty = caseObj.meta.vspxFacultyCase === true || caseObj.createdBy != null;
  const isEnabled = caseObj.meta.vspxEnabled === true;
  return isFaculty && isEnabled;
});
```

### Drag implementation:

- pointerdown on titlebar → capture pointer, record offset
- pointermove → update CSS custom properties (--vspx-tx, --vspx-ty)
- pointerup → release pointer, save geometry to sessionStorage
- Clamp to viewport on window resize

### Resize implementation:

- pointerdown on resize handle → capture, record initial size
- pointermove → update --vspx-w, --vspx-h (clamped to min 320x400, max 90vw x 85vh)
- pointerup → release, save geometry

### iframe lifecycle:

- On expand: create iframe if not exists, set src to VSPx URL, append to body div
- On minimize: detach iframe from DOM but keep reference (preserves WebRTC)
- On re-expand: reattach existing iframe (no reload)
- On close: remove iframe, null reference, reset hasActiveConversation

### Geometry persistence:

- sessionStorage key: 'vspx_chat_geometry'
- Shape: { x: number, y: number, w: number, h: number }
- Restore on mount, save on drag/resize end

## Estimated test count: 8-10 tests

- Access verification: cache hit, cache miss + API success, API unavailable fallback
- Eligibility: enabled case, disabled case, non-faculty case
- Geometry: save/restore from sessionStorage
