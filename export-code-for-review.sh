#!/bin/bash

# Script to export all functional coding files into a single text file for code review
# Excludes: node_modules, dist, .git, lock files, images, and other non-code files

OUTPUT_FILE="code-review-export.txt"

# Clear the output file if it exists
> "$OUTPUT_FILE"

echo "==================================================" >> "$OUTPUT_FILE"
echo "CODE REVIEW EXPORT" >> "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "Project: auroranotes-web" >> "$OUTPUT_FILE"
echo "==================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Find all relevant code files, excluding unwanted directories and files
find . \( \
    -name "*.ts" -o \
    -name "*.tsx" -o \
    -name "*.js" -o \
    -name "*.jsx" -o \
    -name "*.css" -o \
    -name "*.json" -o \
    -name "*.html" \
\) \
    -not -path "./node_modules/*" \
    -not -path "./dist/*" \
    -not -path "./.git/*" \
    -not -name "package-lock.json" \
    -not -name "*.test.ts" \
    -not -name "*.test.tsx" \
    -type f | sort | while read -r file; do
    
    echo "==================================================" >> "$OUTPUT_FILE"
    echo "FILE: $file" >> "$OUTPUT_FILE"
    echo "==================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

# Count files and lines
FILE_COUNT=$(find . \( \
    -name "*.ts" -o \
    -name "*.tsx" -o \
    -name "*.js" -o \
    -name "*.jsx" -o \
    -name "*.css" -o \
    -name "*.json" -o \
    -name "*.html" \
\) \
    -not -path "./node_modules/*" \
    -not -path "./dist/*" \
    -not -path "./.git/*" \
    -not -name "package-lock.json" \
    -not -name "*.test.ts" \
    -not -name "*.test.tsx" \
    -type f | wc -l | tr -d ' ')

LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "Export complete!"
echo "Output file: $OUTPUT_FILE"
echo "Files exported: $FILE_COUNT"
echo "Total lines: $LINE_COUNT"

