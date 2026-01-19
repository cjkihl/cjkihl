# ImageMagick - Agent Instructions

Comprehensive guide for AI agents using ImageMagick for image processing tasks.

## Overview

ImageMagick is a powerful command-line tool for reading, converting, resizing, rotating, and manipulating images. It supports over 100 image formats and provides extensive image processing capabilities.

## Command Syntax

**Modern syntax (recommended):**
```bash
magick [options] input [options] output
```

**Legacy syntax (still supported):**
```bash
convert [options] input [options] output
```

## Core Operations

### 1. Reading Image Information

#### Basic Identify
```bash
magick identify image.jpg
# Output: image.jpg JPEG 1920x1080 1920x1080+0+0 8-bit sRGB 245KB 0.000u 0:00.000
```

#### Get Specific Properties
```bash
# Dimensions
magick identify -format "%wx%h" image.jpg
# Output: 1920x1080

# File size
magick identify -format "%[size]" image.jpg
# Output: 245KB

# Format
magick identify -format "%m" image.jpg
# Output: JPEG

# All properties
magick identify -verbose image.jpg
```

#### Check if Image Exists and Get Info
```bash
if magick identify image.jpg > /dev/null 2>&1; then
  echo "Image exists"
  magick identify -format "%wx%h" image.jpg
else
  echo "Image not found"
fi
```

### 2. Format Conversion

#### Basic Conversion
```bash
# JPEG to PNG
magick input.jpg output.png

# PNG to JPEG
magick input.png output.jpg

# JPEG to WebP
magick input.jpg output.webp

# PNG to AVIF
magick input.png output.avif
```

#### Conversion with Quality
```bash
# JPEG with quality setting
magick input.png -quality 85 output.jpg

# WebP with quality
magick input.jpg -quality 90 output.webp

# AVIF with quality
magick input.jpg -quality 85 output.avif
```

#### Handling Transparency
```bash
# PNG with transparency to JPEG (add white background)
magick input.png -background white -flatten output.jpg

# PNG with transparency to JPEG (add specific color)
magick input.png -background "#ffffff" -flatten output.jpg

# Preserve transparency when converting PNG to PNG
magick input.png output.png  # Transparency preserved automatically
```

### 3. Resizing Images

#### Resize to Specific Dimensions
```bash
# Exact dimensions (may distort)
magick input.jpg -resize 800x600 output.jpg

# Maintain aspect ratio (fit within)
magick input.jpg -resize 800x600\> output.jpg

# Maintain aspect ratio (fill dimensions)
magick input.jpg -resize 800x600^ output.jpg

# Maintain aspect ratio (shrink only)
magick input.jpg -resize 800x600\< output.jpg
```

#### Resize by Percentage
```bash
# 50% of original size
magick input.jpg -resize 50% output.jpg

# 150% of original size
magick input.jpg -resize 150% output.jpg
```

#### Resize by Single Dimension
```bash
# Width only (maintain aspect ratio)
magick input.jpg -resize 800 output.jpg

# Height only (maintain aspect ratio)
magick input.jpg -resize x600 output.jpg
```

#### Thumbnails
```bash
# Create thumbnail (optimized for speed)
magick input.jpg -thumbnail 200x200 output.jpg

# Thumbnail with strip metadata
magick input.jpg -thumbnail 200x200 -strip thumb.jpg
```

#### Responsive Image Generation
```bash
# Generate multiple sizes
magick input.jpg -resize 1920x1080\> large.jpg
magick input.jpg -resize 1280x720\> medium.jpg
magick input.jpg -resize 640x360\> small.jpg
magick input.jpg -resize 320x180\> thumb.jpg
```

### 4. Rotating Images

#### Basic Rotation
```bash
# Rotate 90 degrees clockwise
magick input.jpg -rotate 90 output.jpg

# Rotate 90 degrees counter-clockwise
magick input.jpg -rotate -90 output.jpg

# Rotate 180 degrees
magick input.jpg -rotate 180 output.jpg

# Rotate 45 degrees
magick input.jpg -rotate 45 output.jpg
```

#### Auto-Orient
```bash
# Auto-rotate based on EXIF data
magick input.jpg -auto-orient output.jpg
```

#### Flipping
```bash
# Flip vertically
magick input.jpg -flip output.jpg

# Flip horizontally
magick input.jpg -flop output.jpg
```

### 5. Cropping Images

#### Crop by Dimensions and Position
```bash
# Crop: width x height + x_offset + y_offset
magick input.jpg -crop 800x600+100+50 output.jpg

# Crop from center
magick input.jpg -gravity center -crop 800x600+0+0 output.jpg

# Crop from top-left
magick input.jpg -gravity northwest -crop 800x600+0+0 output.jpg
```

#### Crop by Percentage
```bash
# Crop 50% width, 50% height, starting at 25%, 25%
magick input.jpg -crop 50%x50%+25%+25% output.jpg
```

#### Smart Cropping
```bash
# Crop to square from center
magick input.jpg -gravity center -crop 1:1 output.jpg

# Crop to specific aspect ratio
magick input.jpg -gravity center -crop 16:9 output.jpg
```

### 6. Quality & Optimization

#### JPEG Optimization
```bash
# Set quality (1-100, higher = better quality, larger file)
magick input.jpg -quality 85 output.jpg

# Strip metadata
magick input.jpg -strip output.jpg

# Progressive JPEG
magick input.jpg -interlace Plane output.jpg

# Optimize JPEG
magick input.jpg -sampling-factor 4:2:0 -quality 85 -strip output.jpg
```

#### WebP Optimization
```bash
# WebP with quality
magick input.jpg -quality 90 output.webp

# Lossless WebP
magick input.png -define webp:lossless=true output.webp
```

#### PNG Optimization
```bash
# Reduce colors
magick input.png -colors 256 output.png

# Strip metadata
magick input.png -strip output.png
```

### 7. Filters & Effects

#### Blur
```bash
# Gaussian blur
magick input.jpg -blur 0x2 output.jpg

# Stronger blur
magick input.jpg -blur 0x5 output.jpg
```

#### Sharpen
```bash
# Sharpen image
magick input.jpg -sharpen 0x1 output.jpg

# Stronger sharpening
magick input.jpg -sharpen 0x2 output.jpg
```

#### Brightness & Contrast
```bash
# Adjust brightness and contrast (brightness x contrast)
magick input.jpg -brightness-contrast 10x5 output.jpg

# Increase brightness
magick input.jpg -brightness-contrast 20x0 output.jpg

# Increase contrast
magick input.jpg -brightness-contrast 0x10 output.jpg
```

#### Color Adjustments
```bash
# Adjust brightness, saturation, hue (brightness, saturation, hue)
magick input.jpg -modulate 100,150,100 output.jpg

# Increase saturation
magick input.jpg -modulate 100,200,100 output.jpg

# Desaturate
magick input.jpg -modulate 100,50,100 output.jpg
```

#### Grayscale
```bash
# Convert to grayscale
magick input.jpg -grayscale output.jpg

# Alternative method
magick input.jpg -colorspace Gray output.jpg
```

#### Sepia Effect
```bash
# Apply sepia tone
magick input.jpg -sepia-tone 80% output.jpg
```

### 8. Batch Processing

#### Process Multiple Files
```bash
# Resize all JPG files
magick *.jpg -resize 50% resized_%d.jpg

# Convert all PNG to JPEG
magick *.png -quality 85 converted_%d.jpg

# Process files matching pattern
magick input_*.jpg -resize 800x600 output_%d.jpg
```

#### Combine Images
```bash
# Append vertically
magick input1.jpg input2.jpg input3.jpg -append output.jpg

# Append horizontally
magick input1.jpg input2.jpg input3.jpg +append output.jpg

# Create grid
magick input1.jpg input2.jpg input3.jpg input4.jpg +append temp.jpg
magick temp.jpg input5.jpg input6.jpg -append output.jpg
```

#### In-Place Modification
```bash
# Modify files in place (use mogrify)
mogrify -resize 50% *.jpg
mogrify -quality 85 *.png
mogrify -strip *.jpg
```

### 9. Advanced Operations

#### Composite Images
```bash
# Overlay logo on image
magick background.jpg logo.png -gravity center -composite output.jpg

# Overlay with transparency
magick background.jpg logo.png -gravity southeast -composite output.jpg
```

#### Extract Frames from GIF/Video
```bash
# Extract first frame
magick input.gif[0] output.jpg

# Extract specific frame
magick input.gif[5] output.jpg
```

#### Create Image from Text
```bash
# Create image with text
magick -size 800x200 xc:white -font Arial -pointsize 72 \
  -gravity center -annotate +0+0 "Hello World" output.jpg
```

#### Create Solid Color Image
```bash
# Create solid color image
magick -size 800x600 xc:#ff0000 output.jpg

# Create gradient
magick -size 800x600 gradient:#ff0000-#0000ff output.jpg
```

## Common Workflows

### Web Image Optimization Pipeline
```bash
# 1. Resize
magick input.jpg -resize 1920x1080\> resized.jpg

# 2. Optimize
magick resized.jpg -quality 85 -strip -sampling-factor 4:2:0 optimized.jpg

# 3. Convert to WebP
magick optimized.jpg -quality 90 output.webp
```

### Responsive Image Set Generation
```bash
#!/bin/bash
INPUT="source.jpg"
BASE="image"

# Generate sizes
magick "$INPUT" -resize 1920x1080\> -quality 85 -strip "${BASE}-1920.jpg"
magick "$INPUT" -resize 1280x720\> -quality 85 -strip "${BASE}-1280.jpg"
magick "$INPUT" -resize 640x360\> -quality 85 -strip "${BASE}-640.jpg"
magick "$INPUT" -resize 320x180\> -quality 85 -strip "${BASE}-320.jpg"

# Generate WebP versions
magick "$INPUT" -resize 1920x1080\> -quality 90 "${BASE}-1920.webp"
magick "$INPUT" -resize 1280x720\> -quality 90 "${BASE}-1280.webp"
magick "$INPUT" -resize 640x360\> -quality 90 "${BASE}-640.webp"
magick "$INPUT" -resize 320x180\> -quality 90 "${BASE}-320.webp"
```

### Image Format Migration
```bash
# Convert all JPEGs to WebP
for file in *.jpg; do
  magick "$file" -quality 90 "${file%.jpg}.webp"
done

# Convert all PNGs to optimized JPEGs
for file in *.png; do
  magick "$file" -background white -flatten -quality 85 "${file%.png}.jpg"
done
```

### Thumbnail Generation
```bash
# Generate thumbnails for all images
for file in *.jpg *.png; do
  magick "$file" -thumbnail 200x200 -strip "thumb_${file}"
done
```

## Error Handling

### Check if Command Succeeded
```bash
if magick input.jpg output.png; then
  echo "Conversion successful"
else
  echo "Conversion failed"
  exit 1
fi
```

### Validate Input File
```bash
# Check if file exists and is valid image
if ! magick identify "$INPUT" > /dev/null 2>&1; then
  echo "Error: Invalid image file: $INPUT"
  exit 1
fi
```

### Handle Errors Gracefully
```bash
magick input.jpg output.png 2>&1 | tee error.log
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "Error during conversion"
  cat error.log
  exit 1
fi
```

## Performance Tips

1. **Use `-thumbnail` instead of `-resize`** for thumbnails (faster)
2. **Strip metadata** with `-strip` to reduce file size
3. **Use appropriate quality** - 85 for JPEG, 90 for WebP is usually sufficient
4. **Process in batches** when possible
5. **Use `mogrify`** for in-place modifications (faster than read/write)

## Format Support

ImageMagick supports 100+ formats including:
- **Raster**: JPEG, PNG, GIF, WebP, AVIF, TIFF, BMP, ICO
- **Vector**: SVG, PDF, EPS, PS
- **Raw**: CR2, NEF, ARW, DNG
- **Animated**: GIF, WebP
- **And many more**

## Best Practices

1. **Always verify input** - Use `identify` before processing
2. **Preserve aspect ratio** - Use `\>` or `^` when resizing
3. **Strip metadata** - Use `-strip` for web images
4. **Optimize quality** - Balance file size and quality
5. **Use modern formats** - WebP, AVIF for better compression
6. **Batch operations** - Process multiple files efficiently
7. **Error handling** - Always check command success
8. **Backup originals** - Keep source files when modifying

## Troubleshooting

### "No such file or directory"
- Check file path and permissions
- Verify file exists: `ls -la input.jpg`

### "Unrecognized image format"
- Check if format is supported: `magick -list format`
- Verify file is not corrupted

### "Memory allocation failed"
- Process smaller batches
- Use `-limit memory` option

### Quality Issues
- Increase quality value (1-100)
- Try different formats (WebP often better than JPEG)
- Use `-sampling-factor` for JPEG optimization

## References

- Official Documentation: https://imagemagick.org/script/convert.php
- Command-line Options: https://imagemagick.org/script/command-line-options.php
- Examples: https://imagemagick.org/script/examples.php
- Format Support: https://imagemagick.org/script/formats.php
