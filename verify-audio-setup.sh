#!/bin/bash

echo "🔊 Verifying Amharic Audio Setup"
echo "=================================="
echo ""

# Check if audio directories exist
echo "📁 Checking directories..."
if [ -d "client/public/audio/amharic/numbers" ]; then
    echo "✅ Numbers directory exists"
else
    echo "❌ Numbers directory NOT found"
    exit 1
fi

if [ -d "client/public/audio/amharic/events" ]; then
    echo "✅ Events directory exists"
else
    echo "❌ Events directory NOT found"
    exit 1
fi

echo ""

# Count audio files
echo "📊 Counting audio files..."
NUMBER_COUNT=$(find client/public/audio/amharic/numbers -name "*.mp3" | wc -l)
EVENT_COUNT=$(find client/public/audio/amharic/events -name "*.mp3" | wc -l)

echo "   Numbers: $NUMBER_COUNT files"
echo "   Events: $EVENT_COUNT files"

echo ""

# Check specific required files
echo "🎯 Checking required event files..."
REQUIRED_EVENTS=(
    "game-start"
    "game-paused"
    "game-resumed"
    "congratulations"
    "winner-valid"
    "winner-invalid"
    "card-locked"
    "please-wait"
    "try-again"
)

for event in "${REQUIRED_EVENTS[@]}"; do
    if [ -f "client/public/audio/amharic/events/${event}.mp3" ]; then
        echo "   ✅ ${event}.mp3"
    else
        echo "   ❌ ${event}.mp3 MISSING"
    fi
done

echo ""

# Check sample number files
echo "🔢 Checking sample number files..."
SAMPLE_NUMBERS=("b-1" "i-20" "n-35" "g-50" "o-70")

for num in "${SAMPLE_NUMBERS[@]}"; do
    if [ -f "client/public/audio/amharic/numbers/${num}.mp3" ]; then
        echo "   ✅ ${num}.mp3"
    else
        echo "   ❌ ${num}.mp3 MISSING"
    fi
done

echo ""

# Check if files are valid MP3s
echo "🎵 Verifying file formats..."
SAMPLE_FILE="client/public/audio/amharic/numbers/b-1.mp3"
if [ -f "$SAMPLE_FILE" ]; then
    FILE_TYPE=$(file "$SAMPLE_FILE" | grep -o "Audio file\|MPEG")
    if [ -n "$FILE_TYPE" ]; then
        echo "   ✅ Files are valid audio format"
    else
        echo "   ⚠️  File format might be incorrect"
    fi
else
    echo "   ❌ Cannot verify - sample file not found"
fi

echo ""

# Check if AmharicAudioService exists
echo "📝 Checking service files..."
if [ -f "client/src/services/AmharicAudioService.ts" ]; then
    echo "   ✅ AmharicAudioService.ts exists"
else
    echo "   ❌ AmharicAudioService.ts NOT found"
fi

echo ""

# Check if test page exists
echo "🧪 Checking test page..."
if [ -f "client/public/test-audio.html" ]; then
    echo "   ✅ test-audio.html exists"
else
    echo "   ❌ test-audio.html NOT found"
fi

echo ""
echo "=================================="
echo "✅ Setup verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start dev server: cd client && npm run serve"
echo "2. Open test page: http://localhost:8080/test-audio.html"
echo "3. Test in game with language set to አማርኛ"
echo "4. Check browser console (F12) for debug messages"
echo ""
