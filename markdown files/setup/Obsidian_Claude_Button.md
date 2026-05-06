# Obsidian → Claude Auto-Fix Button

Set up a one-click button inside Obsidian that reads open UI issues, finds the broken code, writes the fix back into the markdown, and updates the Home.md TODO list — automatically.

---

## How It Works

1. You add an open issue to `UI_Issues_Design.md` (problem only, no fix needed)
2. You click the button in the note
3. Obsidian runs the Claude CLI in the background
4. Claude reads the file, finds issues without fixes, looks at the real source code, writes the fix + code snippet back into the markdown, and adds the item to the Home.md TODO list

---

## Plugins to Install

Go to **Settings → Community Plugins → Browse** and install both:

| Plugin | Purpose |
|--------|---------|
| **Shell Commands** | Lets Obsidian run terminal/shell commands |
| **Buttons** | Embeds a clickable button directly inside a note |

---

## Step 1 — Configure Shell Commands

1. Go to **Settings → Shell Commands**
2. Click **New shell command**
3. Paste this as the command:

```bash
cd /home/usiel667/DEV/Practice/barbs-bottles && claude -p "Read 'markdown files/ui/UI_Issues_Design.md'. For every open issue that has no code fix yet, find the relevant source file, locate the exact broken code, then edit the markdown file to add the fix with the exact code snippet and line numbers. Then add any new items to the TODO section in 'markdown files/Home.md'." --allowedTools "Read,Edit,Write,Bash"
```

4. Give it a name: `Claude: Fix UI Issues`
5. Save

---

## Step 2 — Allow File Writes Without Prompting

So Claude doesn't pause and ask for permission every time, add these to `.claude/settings.json` in the project root:

```json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Edit(markdown files/**)",
      "Write(markdown files/**)",
      "Bash(grep:*)"
    ]
  }
}
```

---

## Step 3 — Add the Button to the Note

Open `UI_Issues_Design.md` and paste this block at the top, just below the title:

~~~markdown
```button
name Fix Open Issues with Claude
type command
action Shell Commands: Execute: Claude: Fix UI Issues
color blue
```
~~~

The Buttons plugin will render this as a real clickable button in Reading/Live Preview mode.

---

## Step 4 — Test It

1. Add a new open issue to `UI_Issues_Design.md` with only a problem description (no fix)
2. Switch to Reading mode in Obsidian
3. Click the **Fix Open Issues with Claude** button
4. Check the file — the fix should appear, and Home.md TODO should be updated

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| Button doesn't appear | Make sure you're in Reading or Live Preview mode, not Source mode |
| Claude not found | Run `which claude` in terminal — make sure the path is in your shell's `$PATH` |
| Permission prompts still appear | Verify `.claude/settings.json` has the allow rules from Step 2 |
| Command runs but nothing changes | Run the shell command manually in terminal first to see the error output |

---

## Notes

- The `-p` flag runs Claude non-interactively (no back-and-forth, just executes and exits)
- `--allowedTools` scopes what Claude can touch so it only reads code and edits markdown
- This same pattern can be reused for other notes (Bug_Fixes, etc.) with a different prompt
