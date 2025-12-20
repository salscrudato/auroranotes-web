#!/bin/bash
# Export all backend code files to a single text file
# This script collects all functional code files from the auroranotes-api project

BACKEND_DIR="/Users/salscrudato/Projects/auroranotes-api"
OUTPUT_FILE="/Users/salscrudato/Projects/auroranotes-api/backend-code-full-export.txt"

# Clear the output file
> "$OUTPUT_FILE"

echo "================================================" >> "$OUTPUT_FILE"
echo "AURORANOTES BACKEND - FULL CODE EXPORT" >> "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to add a file to the output
add_file() {
    local filepath="$1"
    local relative_path="${filepath#$BACKEND_DIR/}"
    
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
for config_file in "$BACKEND_DIR/package.json" "$BACKEND_DIR/tsconfig.json" "$BACKEND_DIR/Dockerfile"; do
    if [ -f "$config_file" ]; then
        add_file "$config_file"
    fi
done

# Add all TypeScript source files
echo "Adding source files..."
find "$BACKEND_DIR/src" -type f -name "*.ts" | sort | while read -r file; do
    add_file "$file"
done

# Add all script files
echo "Adding script files..."
find "$BACKEND_DIR/scripts" -type f \( -name "*.ts" -o -name "*.sh" \) | sort | while read -r file; do
    add_file "$file"
done

# Add doc files if they exist
echo "Adding documentation files..."
find "$BACKEND_DIR/docs" -type f -name "*.md" 2>/dev/null | sort | while read -r file; do
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

