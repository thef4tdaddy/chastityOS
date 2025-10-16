#!/bin/bash
# Deployment health check script

set -e

DEPLOYMENT_URL="${1:-http://localhost:5173}"
TIMEOUT="${2:-30}"

echo "🏥 Running health check on: $DEPLOYMENT_URL"
echo "⏱️ Timeout: ${TIMEOUT}s"

# Check if URL is accessible
echo "📡 Checking if site is accessible..."
if curl -f -s --max-time "$TIMEOUT" "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ Site is accessible"
else
    echo "❌ Site is not accessible"
    exit 1
fi

# Check if main JavaScript bundle loads
echo "📦 Checking JavaScript bundle..."
if curl -f -s --max-time "$TIMEOUT" "$DEPLOYMENT_URL" | grep -q "script.*src="; then
    echo "✅ JavaScript bundle reference found"
else
    echo "❌ JavaScript bundle reference not found"
    exit 1
fi

# Check if CSS is loading
echo "🎨 Checking CSS..."
if curl -f -s --max-time "$TIMEOUT" "$DEPLOYMENT_URL" | grep -q "link.*stylesheet"; then
    echo "✅ CSS reference found"
else
    echo "❌ CSS reference not found"
    exit 1
fi

# Check for React app div
echo "⚛️ Checking React app container..."
if curl -f -s --max-time "$TIMEOUT" "$DEPLOYMENT_URL" | grep -q 'id="root"'; then
    echo "✅ React app container found"
else
    echo "❌ React app container not found"
    exit 1
fi

# Check response time
echo "⚡ Checking response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DEPLOYMENT_URL")
if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    echo "✅ Response time: ${RESPONSE_TIME}s (good)"
else
    echo "⚠️ Response time: ${RESPONSE_TIME}s (slow)"
fi

echo "✅ Health check passed!"