---
name: agent-browser
description: Browser automation CLI for AI agents. Use when automating web interactions, testing user flows, scraping web content, or performing browser-based tasks. Fast Rust CLI with Node.js fallback, optimized for AI agent workflows with snapshot-based element selection using refs.
---

# Agent Browser Skill

Browser automation CLI for AI agents. Fast Rust CLI with Node.js fallback, optimized for AI agent workflows.

## When to Use

Use `agent-browser` when you need to:
- Automate web interactions (clicking, filling forms, navigating)
- Test user flows or end-to-end scenarios
- Scrape or extract web page content
- Perform browser-based tasks programmatically
- Debug web applications by interacting with them
- Take screenshots or generate PDFs from web pages

## Core Workflow

The optimal AI agent workflow:

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i --json` (get interactive elements with refs)
3. **Interact**: Use refs (`@e1`, `@e2`) to click, fill, etc.
4. **Re-snapshot**: After page changes, get new snapshot

## Key Commands

### Navigation
- `agent-browser open <url>` - Navigate to URL (aliases: `goto`, `navigate`)
- `agent-browser back` - Go back
- `agent-browser forward` - Go forward
- `agent-browser reload` - Reload page

### Snapshot (Critical for AI)
- `agent-browser snapshot` - Full accessibility tree with refs
- `agent-browser snapshot -i` - Interactive elements only (buttons, inputs, links)
- `agent-browser snapshot -c` - Compact (remove empty structural elements)
- `agent-browser snapshot -d 3` - Limit depth to 3 levels
- `agent-browser snapshot --json` - JSON output for agents

### Interaction (Using Refs - Recommended)
- `agent-browser click @e2` - Click element by ref
- `agent-browser fill @e3 "text"` - Fill input by ref
- `agent-browser get text @e1` - Get text by ref
- `agent-browser hover @e4` - Hover element by ref

### Interaction (Using Selectors)
- `agent-browser click "#submit"` - Click by CSS selector
- `agent-browser fill "#email" "test@example.com"` - Fill by selector
- `agent-browser find role button click --name "Submit"` - Semantic locator

### Form Actions
- `agent-browser type <sel> <text>` - Type into element
- `agent-browser fill <sel> <text>` - Clear and fill
- `agent-browser select <sel> <val>` - Select dropdown option
- `agent-browser check <sel>` - Check checkbox
- `agent-browser uncheck <sel>` - Uncheck checkbox

### Information Retrieval
- `agent-browser get text <sel>` - Get text content
- `agent-browser get html <sel>` - Get innerHTML
- `agent-browser get value <sel>` - Get input value
- `agent-browser get title` - Get page title
- `agent-browser get url` - Get current URL
- `agent-browser get count <sel>` - Count matching elements

### State Checks
- `agent-browser is visible <sel>` - Check if visible
- `agent-browser is enabled <sel>` - Check if enabled
- `agent-browser is checked <sel>` - Check if checked

### Screenshots & PDFs
- `agent-browser screenshot [path]` - Take screenshot
- `agent-browser screenshot --full` - Full page screenshot
- `agent-browser pdf <path>` - Save as PDF

### Wait Operations
- `agent-browser wait <selector>` - Wait for element to be visible
- `agent-browser wait 1000` - Wait for time (milliseconds)
- `agent-browser wait --text "Welcome"` - Wait for text to appear
- `agent-browser wait --url "**/dash"` - Wait for URL pattern

### Browser Settings
- `agent-browser set viewport <w> <h>` - Set viewport size
- `agent-browser set device <name>` - Emulate device ("iPhone 14")
- `agent-browser set headers <json>` - Set HTTP headers
- `agent-browser set credentials <u> <p>` - HTTP basic auth

### Sessions (Isolated Instances)
- `agent-browser --session agent1 open site-a.com` - Use isolated session
- `agent-browser session list` - List active sessions
- `agent-browser session` - Show current session

### Network Control
- `agent-browser network route <url>` - Intercept requests
- `agent-browser network route <url> --abort` - Block requests
- `agent-browser network route <url> --body <json>` - Mock response
- `agent-browser network requests` - View tracked requests

### Debugging
- `agent-browser console` - View console messages
- `agent-browser errors` - View page errors
- `agent-browser highlight <sel>` - Highlight element
- `agent-browser trace start [path]` - Start recording trace

## Why Use Refs?

Refs (`@e1`, `@e2`, etc.) are recommended for AI agents because:
- **Deterministic**: Ref points to exact element from snapshot
- **Fast**: No DOM re-query needed
- **AI-friendly**: Snapshot + ref workflow is optimal for LLMs
- **Stable**: Refs persist until page changes

## Example Workflow

```bash
# 1. Navigate
agent-browser open https://example.com

# 2. Get snapshot with refs
agent-browser snapshot -i --json
# Output includes refs like @e1, @e2, @e3

# 3. Interact using refs
agent-browser click @e2
agent-browser fill @e3 "test@example.com"
agent-browser click @e1

# 4. Re-snapshot after page changes
agent-browser snapshot -i --json
```

## Options

- `--json` - JSON output (for agents)
- `--session <name>` - Use isolated session
- `--headers <json>` - Set HTTP headers
- `--headed` - Show browser window (not headless)
- `--debug` - Debug output
- `--executable-path <path>` - Custom browser executable

## Installation

Already installed. If needed:
```bash
npm install -g agent-browser
agent-browser install  # Download Chromium
```

## Best Practices

1. **Always use snapshots with refs** for element selection
2. **Use `-i` flag** to filter to interactive elements only
3. **Use `--json` flag** for programmatic parsing
4. **Re-snapshot after page changes** to get fresh refs
5. **Use sessions** for isolated browser instances
6. **Wait for elements** before interacting when needed

## References

- GitHub: https://github.com/vercel-labs/agent-browser
- Documentation: https://agent-browser.dev
