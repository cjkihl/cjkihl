---
name: imagemagick
description: ImageMagick command-line tool for reading, converting, resizing, rotating, and manipulating images. Use when processing images, converting formats, resizing images, rotating images, applying filters, or performing batch image operations. Supports 100+ image formats with powerful transformation capabilities.
---

# ImageMagick Skill

ImageMagick is a powerful command-line tool for reading, converting, resizing, rotating, and manipulating images. It supports over 100 image formats and provides extensive image processing capabilities.

## When to Use

Use ImageMagick when you need to:
- Convert images between formats (JPEG, PNG, WebP, AVIF, etc.)
- Resize images (thumbnails, responsive images, optimization)
- Rotate or flip images
- Apply filters and effects (blur, sharpen, adjust colors, etc.)
- Batch process multiple images
- Create image composites or combine images
- Extract image metadata or information
- Optimize images for web (compression, format conversion)
- Generate image variants (different sizes, formats)

## Core Commands

### Basic Conversion
```bash
magick input.jpg output.png                    # Convert format
magick input.png output.webp                   # Convert to WebP
magick input.jpg -resize 50% output.jpg        # Resize to 50%
magick input.jpg -rotate 90 output.jpg        # Rotate 90 degrees
```

### Reading Image Information
```bash
magick identify image.jpg                      # Get image info
magick identify -format "%wx%h" image.jpg     # Get dimensions
magick identify -format "%[size]" image.jpg    # Get file size
```

### Common Operations

#### Resize
- `magick input.jpg -resize 800x600 output.jpg` - Resize to exact dimensions
- `magick input.jpg -resize 50% output.jpg` - Resize by percentage
- `magick input.jpg -resize 800x600^ output.jpg` - Resize to fit (maintain aspect)
- `magick input.jpg -resize 800x600\> output.jpg` - Only resize if larger
- `magick input.jpg -thumbnail 200x200 output.jpg` - Create thumbnail

#### Rotate
- `magick input.jpg -rotate 90 output.jpg` - Rotate 90° clockwise
- `magick input.jpg -rotate -90 output.jpg` - Rotate 90° counter-clockwise
- `magick input.jpg -rotate 45 output.jpg` - Rotate 45°
- `magick input.jpg -flip output.jpg` - Flip vertically
- `magick input.jpg -flop output.jpg` - Flip horizontally

#### Format Conversion
- `magick input.jpg output.png` - JPEG to PNG
- `magick input.png output.webp` - PNG to WebP
- `magick input.jpg output.avif` - JPEG to AVIF
- `magick input.png -quality 85 output.jpg` - PNG to JPEG with quality

#### Quality & Compression
- `magick input.jpg -quality 85 output.jpg` - Set JPEG quality (1-100)
- `magick input.png -quality 90 output.webp` - Set WebP quality
- `magick input.jpg -strip output.jpg` - Remove metadata (reduce size)
- `magick input.jpg -sampling-factor 4:2:0 output.jpg` - Optimize JPEG

#### Filters & Effects
- `magick input.jpg -blur 0x2 output.jpg` - Apply blur
- `magick input.jpg -sharpen 0x1 output.jpg` - Sharpen image
- `magick input.jpg -brightness-contrast 10x5 output.jpg` - Adjust brightness/contrast
- `magick input.jpg -modulate 100,150,100 output.jpg` - Adjust brightness, saturation, hue
- `magick input.jpg -grayscale output.jpg` - Convert to grayscale
- `magick input.jpg -sepia-tone 80% output.jpg` - Apply sepia effect

#### Cropping
- `magick input.jpg -crop 800x600+100+50 output.jpg` - Crop (width x height + x + y)
- `magick input.jpg -crop 50%x50%+25%+25% output.jpg` - Crop by percentage
- `magick input.jpg -gravity center -crop 800x600+0+0 output.jpg` - Center crop

#### Batch Processing
- `magick *.jpg -resize 50% resized_%d.jpg` - Resize all JPGs
- `magick *.png -quality 85 converted_%d.jpg` - Convert all PNGs to JPEG
- `magick input*.jpg -append output.jpg` - Append images vertically
- `magick input*.jpg +append output.jpg` - Append images horizontally

## Common Use Cases

### Web Optimization
```bash
# Convert to WebP with quality optimization
magick input.jpg -quality 85 -strip output.webp

# Create responsive image sizes
magick input.jpg -resize 1920x1080\> large.jpg
magick input.jpg -resize 1280x720\> medium.jpg
magick input.jpg -resize 640x360\> small.jpg

# Generate thumbnail
magick input.jpg -thumbnail 200x200 -strip thumb.jpg
```

### Format Conversion
```bash
# JPEG to PNG (preserve transparency)
magick input.jpg output.png

# PNG to JPEG (with white background)
magick input.png -background white -flatten output.jpg

# Convert to AVIF (modern format)
magick input.jpg -quality 90 output.avif
```

### Image Manipulation
```bash
# Rotate and resize
magick input.jpg -rotate 90 -resize 50% output.jpg

# Apply multiple effects
magick input.jpg -brightness-contrast 10x5 -sharpen 0x1 output.jpg

# Create composite
magick background.jpg logo.png -gravity center -composite output.jpg
```

## Best Practices

1. **Use `magick` command** - Modern ImageMagick uses `magick` (not `convert`)
2. **Preserve aspect ratio** - Use `\>` or `^` modifiers when resizing
3. **Strip metadata** - Use `-strip` for web images to reduce file size
4. **Quality settings** - Use 80-90 for JPEG, 85-95 for WebP
5. **Batch operations** - Use wildcards and `%d` for sequential numbering
6. **Check before processing** - Use `identify` to verify image properties
7. **Optimize for web** - Combine `-strip`, `-quality`, and format conversion

## Command Aliases

- `magick` - Modern command (recommended)
- `convert` - Legacy alias (still works)
- `identify` - Get image information
- `mogrify` - In-place image modification

## Installation

ImageMagick is already installed. If needed:
```bash
# macOS
brew install imagemagick

# Linux
sudo apt-get install imagemagick  # Debian/Ubuntu
sudo yum install ImageMagick      # RHEL/CentOS

# Verify installation
magick --version
```

## References

- Official Documentation: https://imagemagick.org/script/convert.php
- Command-line Options: https://imagemagick.org/script/command-line-options.php
- Examples: https://imagemagick.org/script/examples.php
