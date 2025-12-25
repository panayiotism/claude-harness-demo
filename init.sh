#!/bin/bash
echo "=== Dev Environment Setup ==="
echo "Working directory: $(pwd)"
echo ""

# Git status
if [ -d .git ]; then
    echo "=== Git Status ==="
    echo "Branch: $(git branch --show-current)"
    echo ""
    echo "Recent commits:"
    git log --oneline -5 2>/dev/null || echo "No commits yet"
    echo ""
fi

# Progress summary
if [ -f claude-progress.json ]; then
    echo "=== Session Progress ==="
    if command -v jq &> /dev/null; then
        echo "Last updated: $(jq -r '.lastUpdated' claude-progress.json)"
        echo "Last session summary: $(jq -r '.lastSession.summary' claude-progress.json)"
        echo ""
        echo "Next steps:"
        jq -r '.lastSession.nextSteps[]' claude-progress.json 2>/dev/null | sed 's/^/  - /'
    else
        cat claude-progress.json
    fi
    echo ""
fi

# Pending features
if [ -f feature-list.json ]; then
    echo "=== Pending Features ==="
    if command -v jq &> /dev/null; then
        feature_count=$(jq '.features | length' feature-list.json)
        if [ "$feature_count" -gt 0 ]; then
            jq -r '.features[] | "[\(.status // "pending")] \(.id): \(.title)"' feature-list.json
        else
            echo "No features yet. Use /harness-feature to add one."
        fi
    else
        cat feature-list.json
    fi
fi

echo ""
echo "=== Ready to work! ==="
