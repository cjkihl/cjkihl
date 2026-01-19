# Agent Browser - Agent Instructions

This document provides comprehensive instructions for AI agents using `agent-browser` for browser automation tasks.

## Overview

`agent-browser` is a fast, AI-optimized browser automation CLI tool. It uses a snapshot-based workflow with element references (refs) that is ideal for AI agents.

## Core Philosophy

**Always use the snapshot → ref → interact workflow:**
1. Get a snapshot of the page with element references
2. Identify target elements by their refs (`@e1`, `@e2`, etc.)
3. Interact using refs
4. Re-snapshot when the page changes

## Standard Workflow

### Step 1: Navigate
```bash
agent-browser open <url>
```

### Step 2: Get Interactive Elements
```bash
agent-browser snapshot -i --json
```

The `-i` flag filters to interactive elements only (buttons, inputs, links, etc.), reducing noise. The `--json` flag provides structured output for parsing.

**Output format:**
```json
{
  "success": true,
  "data": {
    "snapshot": "...",
    "refs": {
      "e1": {"role": "button", "name": "Submit"},
      "e2": {"role": "textbox", "name": "Email"},
      ...
    }
  }
}
```

### Step 3: Interact Using Refs
```bash
agent-browser click @e1
agent-browser fill @e2 "test@example.com"
agent-browser get text @e3
```

### Step 4: Re-snapshot After Changes
When the page changes (navigation, form submission, dynamic content), get a new snapshot:
```bash
agent-browser snapshot -i --json
```

## Common Patterns

### Form Filling
```bash
# Get snapshot
agent-browser snapshot -i --json

# Fill form fields (identify refs from snapshot)
agent-browser fill @e2 "email@example.com"
agent-browser fill @e3 "password123"
agent-browser click @e1  # Submit button

# Wait for navigation/change
agent-browser wait --url "**/dashboard"
agent-browser snapshot -i --json
```

### Multi-Step Workflows
```bash
# Step 1: Navigate and snapshot
agent-browser open https://example.com/start
agent-browser snapshot -i --json

# Step 2: Click first action
agent-browser click @e1

# Step 3: Wait and snapshot new page
agent-browser wait --text "Next Step"
agent-browser snapshot -i --json

# Step 4: Continue with new refs
agent-browser fill @e2 "data"
agent-browser click @e3
```

### Error Handling
```bash
# Check if element exists before interacting
agent-browser is visible @e1
# Returns: true/false

# Wait for element to appear
agent-browser wait @e1

# Check for errors
agent-browser errors
```

### Screenshots for Debugging
```bash
# Take screenshot before/after actions
agent-browser screenshot before.png
agent-browser click @e1
agent-browser screenshot after.png
```

## Advanced Features

### Sessions (Isolated Browser Instances)
Use sessions when you need multiple independent browser instances:
```bash
agent-browser --session test1 open site-a.com
agent-browser --session test2 open site-b.com
agent-browser session list
```

### Network Interception
Mock API responses or block requests:
```bash
# Mock API response
agent-browser network route "**/api/users" --body '{"users": []}'

# Block requests
agent-browser network route "**/analytics" --abort

# View requests
agent-browser network requests
```

### Authentication Headers
Skip login flows by setting auth headers:
```bash
agent-browser open api.example.com --headers '{"Authorization": "Bearer <token>"}'
```

### Custom Browser Settings
```bash
# Set viewport
agent-browser set viewport 1920 1080

# Emulate device
agent-browser set device "iPhone 14"

# Set geolocation
agent-browser set geo 37.7749 -122.4194
```

## Snapshot Options

### Filter to Interactive Elements Only
```bash
agent-browser snapshot -i --json
```
Use `-i` to reduce noise and focus on actionable elements.

### Limit Depth
```bash
agent-browser snapshot -d 3 --json
```
Use `-d` to limit tree depth when dealing with deeply nested pages.

### Compact Output
```bash
agent-browser snapshot -c --json
```
Use `-c` to remove empty structural elements.

### Scope to Selector
```bash
agent-browser snapshot -s "#main-content" --json
```
Use `-s` to snapshot only a specific section.

### Combine Options
```bash
agent-browser snapshot -i -c -d 5 --json
```

## Element Selection Strategies

### 1. Refs (Recommended)
Always prefer refs from snapshots:
```bash
agent-browser snapshot -i --json
# Identify ref from output: @e2
agent-browser click @e2
```

### 2. CSS Selectors
When refs aren't available or for one-off tasks:
```bash
agent-browser click "#submit-button"
agent-browser fill ".email-input" "test@example.com"
```

### 3. Semantic Locators
Use semantic locators for more reliable selection:
```bash
agent-browser find role button click --name "Submit"
agent-browser find label "Email" fill "test@example.com"
agent-browser find text "Sign In" click
```

## Best Practices

1. **Always snapshot first** - Don't guess element selectors
2. **Use `-i` flag** - Filter to interactive elements only
3. **Use `--json` flag** - For programmatic parsing
4. **Re-snapshot after changes** - Page changes invalidate refs
5. **Wait before interacting** - Use `wait` commands when needed
6. **Use sessions for isolation** - When testing multiple scenarios
7. **Take screenshots** - For debugging and verification
8. **Check element state** - Use `is visible`, `is enabled` before interacting

## Error Handling

### Element Not Found
```bash
# Wait for element to appear
agent-browser wait @e1

# Or check visibility first
agent-browser is visible @e1
```

### Page Errors
```bash
# Check for JavaScript errors
agent-browser errors

# Check console messages
agent-browser console
```

### Timeouts
```bash
# Wait with timeout
agent-browser wait @e1
# Default timeout is reasonable, but you can retry
```

## Debugging Tips

1. **Use `--headed` flag** to see browser window:
   ```bash
   agent-browser open example.com --headed
   ```

2. **Take screenshots** at key points:
   ```bash
   agent-browser screenshot step1.png
   ```

3. **Check console/errors**:
   ```bash
   agent-browser console
   agent-browser errors
   ```

4. **Highlight elements**:
   ```bash
   agent-browser highlight @e1
   ```

5. **Use trace recording**:
   ```bash
   agent-browser trace start trace.zip
   # ... perform actions ...
   agent-browser trace stop trace.zip
   ```

## Common Use Cases

### Testing Login Flow
```bash
agent-browser open https://example.com/login
agent-browser snapshot -i --json
agent-browser fill @e2 "user@example.com"  # email field
agent-browser fill @e3 "password123"         # password field
agent-browser click @e1                      # submit button
agent-browser wait --url "**/dashboard"
agent-browser snapshot -i --json
```

### Scraping Content
```bash
agent-browser open https://example.com/articles
agent-browser snapshot --json
agent-browser get text @e5  # article title
agent-browser get html @e6 # article content
```

### Form Submission
```bash
agent-browser open https://example.com/form
agent-browser snapshot -i --json
agent-browser fill @e2 "Name"
agent-browser fill @e3 "email@example.com"
agent-browser select @e4 "Option 1"
agent-browser check @e5
agent-browser click @e1  # submit
agent-browser wait --text "Success"
```

## Integration with Other Tools

### With Shell Scripts
```bash
#!/bin/bash
agent-browser open $URL
SNAPSHOT=$(agent-browser snapshot -i --json)
# Parse JSON and extract refs
```

### With Node.js/Python
```javascript
import { execSync } from 'child_process';

const snapshot = JSON.parse(
  execSync('agent-browser snapshot -i --json').toString()
);
const submitRef = Object.keys(snapshot.data.refs).find(
  ref => snapshot.data.refs[ref].name === 'Submit'
);
execSync(`agent-browser click @${submitRef}`);
```

## Performance Tips

1. **Use `-i` flag** - Reduces snapshot size significantly
2. **Limit depth** - Use `-d` for deeply nested pages
3. **Scope snapshots** - Use `-s` to snapshot specific sections
4. **Reuse sessions** - Keep browser instances alive between commands
5. **Batch operations** - Group related commands together

## Troubleshooting

### Browser Not Found
```bash
agent-browser install  # Download Chromium
```

### Ref Not Working
- Page may have changed - re-snapshot
- Element may not be visible - use `wait` or check `is visible`

### Slow Performance
- Use `-i` flag to reduce snapshot size
- Limit depth with `-d`
- Scope with `-s`

### Headless Issues
- Use `--headed` flag to see what's happening
- Check `console` and `errors` commands

## References

- GitHub: https://github.com/vercel-labs/agent-browser
- Documentation: https://agent-browser.dev
- CLI Help: `agent-browser --help`
