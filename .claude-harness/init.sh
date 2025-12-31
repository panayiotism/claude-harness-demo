#!/bin/bash
HARNESS_DIR="$(dirname "$0")"
PROJECT_DIR="$(dirname "$HARNESS_DIR")"

echo "=== Dev Environment Setup ==="
echo "Working directory: $PROJECT_DIR"
echo ""

# Git status
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "=== Git Status ==="
    echo "Branch: $(git -C "$PROJECT_DIR" branch --show-current)"
    echo ""
    echo "Recent commits:"
    git -C "$PROJECT_DIR" log --oneline -5 2>/dev/null || echo "No commits yet"
    echo ""
fi

# Progress summary
if [ -f "$HARNESS_DIR/claude-progress.json" ]; then
    echo "=== Session Progress ==="
    if command -v jq &> /dev/null; then
        echo "Last updated: $(jq -r '.lastUpdated' "$HARNESS_DIR/claude-progress.json")"
        echo "Last session summary: $(jq -r '.lastSession.summary' "$HARNESS_DIR/claude-progress.json")"
        echo ""
        echo "Next steps:"
        jq -r '.lastSession.nextSteps[]' "$HARNESS_DIR/claude-progress.json" 2>/dev/null | sed 's/^/  - /'
    else
        cat "$HARNESS_DIR/claude-progress.json"
    fi
    echo ""
fi

# Pending features
if [ -f "$HARNESS_DIR/feature-list.json" ]; then
    echo "=== Pending Features ==="
    if command -v jq &> /dev/null; then
        feature_count=$(jq '.features | length' "$HARNESS_DIR/feature-list.json")
        if [ "$feature_count" -gt 0 ]; then
            jq -r '.features[] | "[\(.status // "pending")] \(.id): \(.title)"' "$HARNESS_DIR/feature-list.json"
        else
            echo "No features yet. Use /claude-harness:feature to add one."
        fi
    else
        cat "$HARNESS_DIR/feature-list.json"
    fi
fi

echo ""
echo "=== Ready to work! ==="
