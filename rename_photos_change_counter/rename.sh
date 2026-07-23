#!/bin/bash

# Enable case-insensitive matching for extensions (.jpg, .JPG, .jpeg, etc.)
shopt -s nullglob nocaseglob

# Find all common image formats in the current directory
files=(*.jpg *.jpeg *.png)

if [ ${#files[@]} -eq 0 ]; then
    echo "❌ No image files (.jpg, .jpeg, .png) found in this directory."
    exit 1
fi

echo "Found ${#files[@]} image(s). Processing..."

# Step 1: Rename to temporary filenames to prevent accidental overwrites
count=11
temp_files=()
for f in "${files[@]}"; do
    temp_name="temp_rename_${count}.tmp"
    mv "$f" "$temp_name"
    temp_files+=("$temp_name")
    ((count++))
done

# Step 2: Rename to the final Photo-X.jpeg format
count=11
for temp in "${temp_files[@]}"; do
    final_name="Photo-${count}.jpeg"
    mv "$temp" "$final_name"
    echo "Renamed -> $final_name"
    ((count++))
done

echo "✅ Success! Renamed ${#files[@]} images."
