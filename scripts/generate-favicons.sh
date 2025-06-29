#!/bin/bash

# Generate Favicons Script for SecureContract Pro
# This script converts SVG files to various favicon formats

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if ImageMagick is installed
check_imagemagick() {
    if ! command -v convert >/dev/null 2>&1; then
        print_error "ImageMagick is not installed"
        print_status "Installing ImageMagick..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y imagemagick
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install imagemagick
        else
            print_error "Please install ImageMagick manually"
            print_status "Visit: https://imagemagick.org/script/download.php"
            exit 1
        fi
    fi
    print_success "ImageMagick is available"
}

# Check if Inkscape is installed (better SVG to PNG conversion)
check_inkscape() {
    if command -v inkscape >/dev/null 2>&1; then
        print_success "Inkscape is available (recommended for SVG conversion)"
        return 0
    else
        print_warning "Inkscape not found, using ImageMagick for SVG conversion"
        return 1
    fi
}

# Convert SVG to PNG using Inkscape (preferred) or ImageMagick
convert_svg_to_png() {
    local input_svg="$1"
    local output_png="$2"
    local size="$3"
    
    if command -v inkscape >/dev/null 2>&1; then
        inkscape --export-type=png --export-filename="$output_png" --export-width="$size" --export-height="$size" "$input_svg"
    else
        convert -background transparent -size "${size}x${size}" "$input_svg" "$output_png"
    fi
}

# Generate favicon.ico from PNG files
generate_favicon_ico() {
    print_status "Generating favicon.ico..."
    
    # Create temporary PNG files if they don't exist
    if [ ! -f "public/favicon-16x16.png" ]; then
        convert_svg_to_png "public/favicon-16x16.svg" "public/favicon-16x16.png" 16
    fi
    
    if [ ! -f "public/favicon-32x32.png" ]; then
        convert_svg_to_png "public/favicon-32x32.svg" "public/favicon-32x32.png" 32
    fi
    
    # Generate favicon.ico with multiple sizes
    convert public/favicon-16x16.png public/favicon-32x32.png public/favicon.ico
    
    print_success "Generated favicon.ico"
}

# Generate all favicon formats
generate_all_favicons() {
    print_status "Generating all favicon formats..."
    
    # Create public directory if it doesn't exist
    mkdir -p public
    
    # Generate PNG versions from SVG
    print_status "Converting SVG files to PNG..."
    
    # 16x16 favicon
    if [ -f "public/favicon-16x16.svg" ]; then
        convert_svg_to_png "public/favicon-16x16.svg" "public/favicon-16x16.png" 16
        print_success "Generated favicon-16x16.png"
    fi
    
    # 32x32 favicon
    if [ -f "public/favicon-32x32.svg" ]; then
        convert_svg_to_png "public/favicon-32x32.svg" "public/favicon-32x32.png" 32
        print_success "Generated favicon-32x32.png"
    fi
    
    # Apple touch icon (180x180)
    if [ -f "public/apple-touch-icon.svg" ]; then
        convert_svg_to_png "public/apple-touch-icon.svg" "public/apple-touch-icon.png" 180
        print_success "Generated apple-touch-icon.png"
    fi
    
    # Android Chrome icons
    if [ -f "public/logo.svg" ]; then
        convert_svg_to_png "public/logo.svg" "public/android-chrome-192x192.png" 192
        convert_svg_to_png "public/logo.svg" "public/android-chrome-512x512.png" 512
        print_success "Generated Android Chrome icons"
    fi
    
    # MS Tile icon
    if [ -f "public/logo.svg" ]; then
        convert_svg_to_png "public/logo.svg" "public/mstile-150x150.png" 150
        print_success "Generated MS Tile icon"
    fi
    
    # Generate favicon.ico
    generate_favicon_ico
    
    # Generate Safari pinned tab icon (monochrome SVG)
    create_safari_pinned_tab
}

# Create Safari pinned tab icon (monochrome)
create_safari_pinned_tab() {
    print_status "Creating Safari pinned tab icon..."
    
    cat > public/safari-pinned-tab.svg << 'EOF'
<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
<g transform="translate(0,16) scale(0.1,-0.1)" fill="#000000" stroke="none">
<path d="M30 80 l0 -50 50 0 50 0 0 50 0 50 -50 0 -50 0 0 -50z m80 30 l0 -30 -30 0 -30 0 0 30 0 30 30 0 30 0 0 -30z"/>
<path d="M45 95 l0 -15 15 0 15 0 0 15 0 15 -15 0 -15 0 0 -15z"/>
<path d="M50 70 l0 -5 10 0 10 0 0 5 0 5 -10 0 -10 0 0 -5z"/>
<path d="M50 55 l0 -5 10 0 10 0 0 5 0 5 -10 0 -10 0 0 -5z"/>
<path d="M50 40 l0 -5 5 0 5 0 0 5 0 5 -5 0 -5 0 0 -5z"/>
</g>
</svg>
EOF
    
    print_success "Generated Safari pinned tab icon"
}

# Update site.webmanifest with correct icon paths
update_webmanifest() {
    print_status "Updating site.webmanifest..."
    
    cat > public/site.webmanifest << 'EOF'
{
  "name": "SecureContract Pro",
  "short_name": "SecureContract",
  "description": "Professional Digital Contract Management Platform",
  "icons": [
    {
      "src": "/favicon-16x16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#1e40af",
  "background_color": "#0f172a",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
EOF
    
    print_success "Updated site.webmanifest"
}

# Clean up temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    # Remove SVG files if PNG versions exist
    # (Uncomment if you want to keep only PNG files)
    # rm -f public/favicon-16x16.svg public/favicon-32x32.svg public/apple-touch-icon.svg
    print_success "Cleanup completed"
}

# Main function
main() {
    echo "🎨 SecureContract Pro - Favicon Generator"
    echo "========================================"
    
    # Check dependencies
    check_imagemagick
    check_inkscape
    
    # Generate all favicons
    generate_all_favicons
    
    # Update manifest
    update_webmanifest
    
    # Optional cleanup
    # cleanup
    
    print_success "🎉 All favicons generated successfully!"
    echo ""
    echo "Generated files:"
    echo "- favicon.ico (multi-size)"
    echo "- favicon-16x16.png"
    echo "- favicon-32x32.png"
    echo "- apple-touch-icon.png"
    echo "- android-chrome-192x192.png"
    echo "- android-chrome-512x512.png"
    echo "- mstile-150x150.png"
    echo "- safari-pinned-tab.svg"
    echo "- Updated site.webmanifest"
    echo ""
    echo "Your SecureContract Pro branding is now complete! 🚀"
}

# Run the main function
main "$@"
