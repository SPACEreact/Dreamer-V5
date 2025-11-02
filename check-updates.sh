#!/bin/bash

echo "🔍 Dreamer App Update Verification Script"
echo "=========================================="

# Function to check if a URL is accessible
check_url() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    if curl -s -I "$url" | grep -q "200 OK"; then
        echo "✅ Accessible"
        return 0
    else
        echo "❌ Not accessible"
        return 1
    fi
}

# Function to get file sizes from a deployment
get_bundle_info() {
    local url=$1
    local name=$2
    
    echo -e "\n📊 $name Bundle Analysis:"
    echo "----------------------------"
    
    # Get the HTML to extract asset names
    local html=$(curl -s "$url")
    
    # Extract CSS file
    local css_file=$(echo "$html" | grep -o 'assets/[a-zA-Z0-9_-]*\.css' | head -1)
    if [ ! -z "$css_file" ]; then
        local css_url="$url/$css_file"
        local css_size=$(curl -s -I "$css_url" | grep -i content-length | awk '{print $2}' | tr -d '\r')
        if [ ! -z "$css_size" ]; then
            echo "CSS: $(echo $css_size | awk '{printf "%.2f MB", $1/1024/1024}')"
        fi
    fi
    
    # Extract main JS file (usually the largest)
    local js_files=$(echo "$html" | grep -o 'assets/[a-zA-Z0-9_-]*\.js')
    local largest_js=""
    local largest_size=0
    
    for js_file in $js_files; do
        local js_url="$url/$js_file"
        local js_size=$(curl -s -I "$js_url" | grep -i content-length | awk '{print $2}' | tr -d '\r')
        if [ ! -z "$js_size" ] && [ "$js_size" -gt "$largest_size" ]; then
            largest_size=$js_size
            largest_js=$js_file
        fi
    done
    
    if [ ! -z "$largest_js" ]; then
        echo "Main JS: $(echo $largest_size | awk '{printf "%.2f MB", $1/1024/1024}')"
    fi
    
    # Count total assets
    local asset_count=$(echo "$js_files" | wc -w)
    echo "Total JS files: $asset_count"
}

# Main checks
echo "Checking all deployments..."
echo

# Old deployment
check_url "https://rjyp960cxjq9.space.minimax.io" "Old Deployment"

# First update
check_url "https://i8vy86agolkm.space.minimax.io" "First Update"

# Latest optimized
check_url "https://1jq50eoiddwp.space.minimax.io" "Latest Optimized"

echo
echo "🎯 Recommendation: Use https://1jq50eoiddwp.space.minimax.io"
echo

# Show bundle analysis for the recommended URL
get_bundle_info "https://1jq50eoiddwp.space.minimax.io" "Recommended Deployment"

echo
echo "📋 Quick Fix Instructions:"
echo "1. Open the recommended URL in your browser"
echo "2. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
echo "3. Check that new features are visible"
echo "4. If issues persist, try incognito/private mode"
echo

echo "✨ If you can see all updates and features working correctly, the fix is successful!"
