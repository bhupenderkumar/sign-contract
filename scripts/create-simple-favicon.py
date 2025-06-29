#!/usr/bin/env python3
"""
Simple favicon generator for SecureContract Pro
Creates a basic favicon.ico file using PIL (Python Imaging Library)
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("PIL (Pillow) not installed. Install with: pip install Pillow")
    exit(1)

def create_simple_favicon():
    """Create a simple 32x32 favicon with the SecureContract Pro design"""
    
    # Create a new image with transparent background
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle (blue)
    draw.ellipse([2, 2, size-2, size-2], fill=(30, 64, 175, 255))  # #1e40af
    
    # Document rectangle (white)
    doc_left = 8
    doc_top = 6
    doc_right = 20
    doc_bottom = 22
    draw.rectangle([doc_left, doc_top, doc_right, doc_bottom], fill=(255, 255, 255, 255))
    
    # Document lines (blue)
    line_color = (30, 64, 175, 255)
    draw.line([doc_left + 2, doc_top + 3, doc_right - 2, doc_top + 3], fill=line_color, width=1)
    draw.line([doc_left + 2, doc_top + 6, doc_right - 2, doc_top + 6], fill=line_color, width=1)
    draw.line([doc_left + 2, doc_top + 9, doc_right - 4, doc_top + 9], fill=line_color, width=1)
    
    # Security shield (green)
    shield_center_x = 16
    shield_center_y = 18
    shield_size = 6
    
    # Shield background
    shield_points = [
        (shield_center_x, shield_center_y - shield_size//2),
        (shield_center_x + shield_size//2, shield_center_y),
        (shield_center_x, shield_center_y + shield_size//2),
        (shield_center_x - shield_size//2, shield_center_y)
    ]
    draw.polygon(shield_points, fill=(16, 185, 129, 255))  # #10b981
    
    # Checkmark (white)
    check_points = [
        (shield_center_x - 2, shield_center_y),
        (shield_center_x - 1, shield_center_y + 1),
        (shield_center_x + 2, shield_center_y - 2)
    ]
    draw.line([check_points[0], check_points[1]], fill=(255, 255, 255, 255), width=1)
    draw.line([check_points[1], check_points[2]], fill=(255, 255, 255, 255), width=1)
    
    # Signature line (purple)
    sig_y = 26
    draw.line([doc_left + 2, sig_y, doc_right - 4, sig_y], fill=(99, 102, 241, 255), width=2)  # #6366f1
    
    # Signature dot
    draw.ellipse([doc_right - 2, sig_y - 1, doc_right, sig_y + 1], fill=(99, 102, 241, 255))
    
    return img

def save_favicon():
    """Save the favicon in multiple formats"""
    
    # Create the favicon image
    favicon_img = create_simple_favicon()
    
    # Ensure public directory exists
    os.makedirs('public', exist_ok=True)
    
    # Save as PNG (for modern browsers)
    favicon_img.save('public/favicon-32x32.png', 'PNG')
    print("✅ Created public/favicon-32x32.png")
    
    # Create 16x16 version
    favicon_16 = favicon_img.resize((16, 16), Image.Resampling.LANCZOS)
    favicon_16.save('public/favicon-16x16.png', 'PNG')
    print("✅ Created public/favicon-16x16.png")
    
    # Create ICO file with multiple sizes
    favicon_img.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
    print("✅ Created public/favicon.ico")
    
    # Create larger versions for mobile
    apple_icon = favicon_img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('public/apple-touch-icon.png', 'PNG')
    print("✅ Created public/apple-touch-icon.png")
    
    android_192 = favicon_img.resize((192, 192), Image.Resampling.LANCZOS)
    android_192.save('public/android-chrome-192x192.png', 'PNG')
    print("✅ Created public/android-chrome-192x192.png")
    
    android_512 = favicon_img.resize((512, 512), Image.Resampling.LANCZOS)
    android_512.save('public/android-chrome-512x512.png', 'PNG')
    print("✅ Created public/android-chrome-512x512.png")
    
    print("\n🎉 All favicon files created successfully!")
    print("Your SecureContract Pro branding is now complete!")

if __name__ == "__main__":
    print("🎨 Creating SecureContract Pro Favicon...")
    print("=" * 40)
    save_favicon()
