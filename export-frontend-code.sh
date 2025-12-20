#!/bin/bash
# Export all frontend code files to a single text file for external code review
# This script collects all functional code files from the auroranotes-web project

FRONTEND_DIR="/Users/salscrudato/Projects/auroranotes-web"
OUTPUT_FILE="$FRONTEND_DIR/frontend-code-full-export.txt"

# Clear the output file
> "$OUTPUT_FILE"

echo "================================================" >> "$OUTPUT_FILE"
echo "AURORANOTES FRONTEND - FULL CODE EXPORT" >> "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "For External Code Review" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to add a file to the output
add_file() {
    local filepath="$1"
    local relative_path="${filepath#$FRONTEND_DIR/}"
    
    echo "" >> "$OUTPUT_FILE"
    echo "================================================" >> "$OUTPUT_FILE"
    echo "FILE: $relative_path" >> "$OUTPUT_FILE"
    echo "================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$filepath" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

# Add config files first
echo "Adding configuration files..."
for config_file in "$FRONTEND_DIR/package.json" "$FRONTEND_DIR/tsconfig.json" "$FRONTEND_DIR/tsconfig.app.json" "$FRONTEND_DIR/tsconfig.node.json" "$FRONTEND_DIR/vite.config.ts" "$FRONTEND_DIR/eslint.config.js" "$FRONTEND_DIR/firebase.json" "$FRONTEND_DIR/index.html"; do
    if [ -f "$config_file" ]; then
        add_file "$config_file"
    fi
done

# Add all TypeScript/TSX source files (sorted for consistent ordering)
echo "Adding source files..."
find "$FRONTEND_DIR/src" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort | while read -r file; do
    add_file "$file"
done

# Add CSS files
echo "Adding style files..."
find "$FRONTEND_DIR/src" -type f -name "*.css" | sort | while read -r file; do
    add_file "$file"
done

# Count files and lines
FILE_COUNT=$(grep -c "^FILE:" "$OUTPUT_FILE")
LINE_COUNT=$(wc -l < "$OUTPUT_FILE")

echo "" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"
echo "EXPORT SUMMARY" >> "$OUTPUT_FILE"
echo "Total files: $FILE_COUNT" >> "$OUTPUT_FILE"
echo "Total lines: $LINE_COUNT" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"

echo ""
echo "Export complete!"
echo "Output file: $OUTPUT_FILE"
echo "Total files exported: $FILE_COUNT"
echo "Total lines: $LINE_COUNT"

