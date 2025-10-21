# Mesmer - Brave Browser Fix

## Debug Panel Added!

A **green debug panel** now appears in the top-left corner showing real-time status.

## What to Do in Brave:

### 1. Hard Refresh
Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows/Linux)

### 2. Look for Green Debug Panel
You should see a **green box** in top-left corner with:
```
MESMER DEBUG
✓ Debug logger initialized
→ Initializing Mesmer...
→ Creating main shader...
✓ Main shader OK (8 shaders)
→ Creating toy renderer...
✓ Toy renderer OK (8 shaders)
...
✓ MESMER READY!
→ Click PLAY to start music
```

### 3. If Debug Panel Shows Errors

**Check Brave Shields:**

1. Click the **Lion icon** (Brave Shields) in URL bar
2. Look for blocked items
3. Try these fixes:

**Option A: Disable Shields for localhost**
- Click Brave Shields icon
- Click "Advanced View"
- Toggle "Shields" to OFF for `http://localhost:8300`
- Refresh page

**Option B: Allow All Resources**
- Shields → Advanced View
- **Block Trackers & Ads**: OFF
- **Block Scripts**: OFF
- **Block Fingerprinting**: Standard
- Refresh page

### 4. Click Play Button

Watch the debug panel update:
```
→ Play button clicked
→ Starting Tone.js...
✓ Tone.js started: running
✓ Audio engine resumed
✓ Music PLAYING!
```

### 5. If Still Not Working

**Check what the debug panel says:**

**If it shows:**
- `✗ JS Error: ...` → JavaScript blocked
- `✗ INIT FAILED: ...` → Initialization problem
- `✗ Playback failed: ...` → Audio blocked

**Take a screenshot** of the debug panel and share it!

## Common Brave Issues:

### Issue 1: "Script blocked"
**Fix:** Disable "Block Scripts" in Brave Shields

### Issue 2: "WebGL not supported"
**Fix:** Enable Hardware Acceleration
- brave://settings/system
- Enable "Use hardware acceleration"
- Restart Brave

### Issue 3: "AudioContext suspended"
**Fix:** This is normal - just click Play button

### Issue 4: Tone.js CDN blocked
**Fix:** Allow CDN in Brave Shields
- Shields → Advanced View
- Allow `cdnjs.cloudflare.com`

## Safari vs Brave

**Safari works because:**
- Less aggressive blocking
- Better WebGL support by default
- No ad/tracker blocking by default

**Brave blocks:**
- Some CDN scripts
- Web Audio API in some cases
- Third-party resources
- Fingerprinting APIs

## Debug Panel Controls

**Hide the panel:** Click the red "Hide" button
**Show console:** Press F12 for full console output

## What You Should See

When working correctly, debug panel shows:
```
[timestamp] ✓ Debug logger initialized
[timestamp] → Initializing Mesmer...
[timestamp] ✓ Main shader OK (8 shaders)
[timestamp] ✓ Toy renderer OK (8 shaders)
[timestamp] ✓ Shader editor OK
[timestamp] ✓ Audio engine ready
[timestamp] ✓ Music engine ready
[timestamp] ✓ MESMER READY!
[timestamp] → Click PLAY to start music
```

Then after clicking Play:
```
[timestamp] → Play button clicked
[timestamp] → Starting Tone.js...
[timestamp] ✓ Tone.js started: running
[timestamp] ✓ Audio engine resumed
[timestamp] ✓ Music PLAYING!
```

## Still Not Working?

1. Screenshot the debug panel
2. Check browser console (F12)
3. Try in Incognito mode (Cmd+Shift+N)
4. Try with all extensions disabled
5. Clear cache: brave://settings/clearBrowserData

---

The debug panel shows EXACTLY where it's failing!
