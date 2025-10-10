#!/bin/sh
# Taken from husky v8

# This script ensures hooks are only run when inside a Git working tree
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $1"
  }

  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."

  if [ -z "$(git rev-parse --git-dir 2>/dev/null)" ]; then
    echo "Can't find .git directory, skipping $hook_name hook"
    exit 0
  fi
fi