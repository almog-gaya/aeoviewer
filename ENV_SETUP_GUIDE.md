# What to Put in Your .env File

## Step 1: Start Simple (Test Without VPN First)

Add these to your `.env` file:

```env
# Your existing AI API keys (you probably already have these)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-claude-key-here
GEMINI_API_KEY=your-gemini-key-here
PERPLEXITY_API_KEY=pplx-your-perplexity-key-here
GROK_API_KEY=xai-your-grok-key-here

# VPN Setup - Start with VPN DISABLED
enable_vpn=true
VPN_REGION_STRATEGY=round_robin
```

**Test this first** by running your existing code. Everything should work normally.

## Step 2: Get a VPN/Proxy Service

You need a proxy service that gives you different IP addresses. Here are your options:

### Option A: Use Your Existing VPN (Easiest)
If you have NordVPN, ExpressVPN, Surfshark, etc., they usually offer proxy servers:

- **NordVPN**: Go to https://nordvpn.com/servers/tools/ 
- **ExpressVPN**: Check their proxy settings in the app
- **Surfshark**: Look for proxy server details in your account

### Option B: Get a Dedicated Proxy Service (Recommended)
- **Bright Data**: https://brightdata.com/ (Professional, $500+/month)
- **ProxyMesh**: https://proxymesh.com/ (Affordable, $10/month)
- **Storm Proxies**: https://stormproxies.cn/ (Budget option)

### Option C: Free Testing (Not for Production)
- Use free proxy lists (unreliable, for testing only)
- Set up your own proxy on a VPS

## Step 3: Add ONE VPN Endpoint

Once you have a proxy service, add **just one** endpoint to test:

```env
# Enable VPN
ENABLE_VPN=true

# Add ONE VPN endpoint (example with ProxyMesh)
VPN_US_EAST_1_HOST=us-il.proxymesh.com
VPN_US_EAST_1_PORT=31280
VPN_US_EAST_1_USERNAME=your-proxymesh-username
VPN_US_EAST_1_PASSWORD=your-proxymesh-password
```

Replace the values above with your actual proxy details.

## Step 4: Test the Setup

Run this command to test:
```bash
node scripts/test-vpn-system.js
```

## Step 5: Add More Regions (Optional)

Once one VPN endpoint works, you can add more regions:

```env
# US East (you already have this)
VPN_US_EAST_1_HOST=us-east-proxy.example.com
VPN_US_EAST_1_PORT=8080
VPN_US_EAST_1_USERNAME=username
VPN_US_EAST_1_PASSWORD=password

# EU West
VPN_EU_WEST_1_HOST=eu-west-proxy.example.com
VPN_EU_WEST_1_PORT=8080
VPN_EU_WEST_1_USERNAME=username
VPN_EU_WEST_1_PASSWORD=password

# Asia Pacific
VPN_AP_SOUTHEAST_1_HOST=asia-proxy.example.com
VPN_AP_SOUTHEAST_1_PORT=8080
VPN_AP_SOUTHEAST_1_USERNAME=username
VPN_AP_SOUTHEAST_1_PASSWORD=password
```

## Real Examples with Popular Services

### NordVPN Example
```env
ENABLE_VPN=true
VPN_US_EAST_1_HOST=us9999.nordvpn.com
VPN_US_EAST_1_PORT=80
VPN_US_EAST_1_USERNAME=your-nordvpn-username
VPN_US_EAST_1_PASSWORD=your-nordvpn-password
```

### Bright Data Example
```env
ENABLE_VPN=true
VPN_US_EAST_1_HOST=zproxy.lum-superproxy.io
VPN_US_EAST_1_PORT=22225
VPN_US_EAST_1_USERNAME=your-username-session-123
VPN_US_EAST_1_PASSWORD=your-bright-data-password
```

### ProxyMesh Example
```env
ENABLE_VPN=true
VPN_US_EAST_1_HOST=us-il.proxymesh.com
VPN_US_EAST_1_PORT=31280
VPN_US_EAST_1_USERNAME=your-proxymesh-username
VPN_US_EAST_1_PASSWORD=your-proxymesh-password
```

## Complete .env File Example

Here's what your complete `.env` file might look like:

```env
# AI API Keys
OPENAI_API_KEY=sk-proj-abc123...
ANTHROPIC_API_KEY=sk-ant-xyz789...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
GROK_API_KEY=xai-...

# VPN Configuration
ENABLE_VPN=true
VPN_REGION_STRATEGY=round_robin
VPN_TIMEOUT=30000

# VPN Endpoints
VPN_US_EAST_1_HOST=us-il.proxymesh.com
VPN_US_EAST_1_PORT=31280
VPN_US_EAST_1_USERNAME=yourusername
VPN_US_EAST_1_PASSWORD=yourpassword

# Optional: Your existing settings
PICK_LOCAL=0
```

## Troubleshooting

### "No VPN regions available"
- Make sure `ENABLE_VPN=true`
- Check that you have at least one `VPN_*_HOST` configured
- Verify your proxy credentials are correct

### "VPN connection failed"
- Test your proxy settings with a tool like curl first
- Check if your proxy requires authentication
- Verify the hostname and port are correct

### "Still not working?"
1. Start with `enable_vpn=true` and test normal operation
2. Get working proxy credentials from your provider
3. Add ONE endpoint and test with the test script
4. Check the API endpoint: `GET /api/vpn/status`

## Quick Start Checklist

- [ ] Add your AI API keys to `.env`
- [ ] Set `enable_vpn=true` and test normal operation
- [ ] Get proxy/VPN service credentials
- [ ] Add ONE VPN endpoint to `.env`
- [ ] Set `ENABLE_VPN=true`
- [ ] Run `node scripts/test-vpn-system.js`
- [ ] Test with actual API calls
- [ ] Add more regions if needed 