#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# BloodConnect Frontend — clean-start.sh
#
# Use this whenever:
#   • First time setting up after cloning
#   • Vite feels sluggish / page takes forever to load
#   • You see "optimizing dependencies" every single start
#   • After a major dependency change
#
# What it does:
#   1. Removes stale Vite config timestamp files
#   2. Nukes the empty/broken .vite dep cache
#   3. Runs `vite optimize` to pre-bundle ALL deps before the server starts
#   4. Starts the dev server (already warm — first page load is instant)
#
# Usage:
#   cd frontend && bash clean-start.sh           # clean + start
#   cd frontend && bash clean-start.sh --only    # pre-bundle only, no server
# ─────────────────────────────────────────────────────────────────────────────
set -e

BOLD="\033[1m"; GREEN="\033[32m"; YELLOW="\033[33m"; CYAN="\033[36m"; RESET="\033[0m"

echo -e "${BOLD}🩸 BloodConnect — Clean Dev Start${RESET}"
echo "───────────────────────────────────"

# 1. Remove stale Vite config timestamp files
echo -e "${YELLOW}[1/3] Removing stale timestamp files...${RESET}"
rm -f vite.config.ts.timestamp-*.mjs 2>/dev/null || true
echo -e "${GREEN}      ✓ Done${RESET}"

# 2. Nuke the broken .vite cache so it gets rebuilt clean
echo -e "${YELLOW}[2/3] Clearing dep cache (node_modules/.vite)...${RESET}"
rm -rf node_modules/.vite 2>/dev/null || true
echo -e "${GREEN}      ✓ Done${RESET}"

# 3. Pre-bundle all deps BEFORE the server opens
#    This is the key step — vite optimize runs esbuild on all optimizeDeps.include
#    entries and writes them to node_modules/.vite/deps/. When the browser then
#    visits localhost:5173, everything is already cached → instant first load.
echo -e "${YELLOW}[3/3] Pre-bundling dependencies (this takes ~10s once)...${RESET}"
npx vite optimize
echo -e "${GREEN}      ✓ Cache built — subsequent starts will be instant${RESET}"

echo ""
echo -e "${CYAN}${BOLD}Cache is warm. First page load will be fast.${RESET}"
echo ""

if [ "$1" = "--only" ]; then
  echo "  → Pre-bundle only mode. Run 'npm run dev' to start the server."
  exit 0
fi

echo -e "${BOLD}🚀 Starting dev server...${RESET}"
echo -e "   Open ${CYAN}http://localhost:5173${RESET} in your browser once you see 'ready in Xms'"
echo ""
npm run dev
