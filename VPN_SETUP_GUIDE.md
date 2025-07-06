# VPN Multi-Region Querying Setup Guide

This guide will help you set up VPN-based multi-region querying for your AI engine API calls.

## Overview

The VPN system allows you to route AI API requests through different geographic regions using VPN proxies. This provides:

- **Geographic Diversity**: Query from different regions to get varied responses
- **Improved Reliability**: Automatic failover between VPN endpoints
- **Load Balancing**: Distribute requests across multiple regions
- **Rate Limit Avoidance**: Spread requests across different IP addresses

## Environment Variables

Add these variables to your `.env` file:

```env
# Enable VPN functionality
ENABLE_VPN=true

# VPN Configuration
VPN_REGION_STRATEGY=round_robin  # Options: round_robin, random, geographic_spread, latency_based, load_balanced
VPN_PREFERRED_REGION=us-east     # Optional: prefer a specific region
VPN_TIMEOUT=30000                # Timeout in milliseconds

# VPN Endpoints - US East
VPN_US_EAST_1_HOST=us-east-1.yourprovider.com
VPN_US_EAST_1_PORT=8080
VPN_US_EAST_1_USERNAME=your_username
VPN_US_EAST_1_PASSWORD=your_password

VPN_US_EAST_2_HOST=us-east-2.yourprovider.com
VPN_US_EAST_2_PORT=8080
VPN_US_EAST_2_USERNAME=your_username
VPN_US_EAST_2_PASSWORD=your_password

# VPN Endpoints - US West
VPN_US_WEST_1_HOST=us-west-1.yourprovider.com
VPN_US_WEST_1_PORT=8080
VPN_US_WEST_1_USERNAME=your_username
VPN_US_WEST_1_PASSWORD=your_password

# VPN Endpoints - EU West
VPN_EU_WEST_1_HOST=eu-west-1.yourprovider.com
VPN_EU_WEST_1_PORT=8080
VPN_EU_WEST_1_USERNAME=your_username
VPN_EU_WEST_1_PASSWORD=your_password

# VPN Endpoints - EU Central
VPN_EU_CENTRAL_1_HOST=eu-central-1.yourprovider.com
VPN_EU_CENTRAL_1_PORT=8080
VPN_EU_CENTRAL_1_USERNAME=your_username
VPN_EU_CENTRAL_1_PASSWORD=your_password

# VPN Endpoints - AP Southeast
VPN_AP_SOUTHEAST_1_HOST=ap-southeast-1.yourprovider.com
VPN_AP_SOUTHEAST_1_PORT=8080
VPN_AP_SOUTHEAST_1_USERNAME=your_username
VPN_AP_SOUTHEAST_1_PASSWORD=your_password

# VPN Endpoints - AP Northeast
VPN_AP_NORTHEAST_1_HOST=ap-northeast-1.yourprovider.com
VPN_AP_NORTHEAST_1_PORT=8080
VPN_AP_NORTHEAST_1_USERNAME=your_username
VPN_AP_NORTHEAST_1_PASSWORD=your_password
```

## Region Distribution Strategies

### 1. Round Robin (`round_robin`)
Cycles through available regions in order. Best for even distribution.

### 2. Random (`random`)
Selects a random region for each request. Good for unpredictable patterns.

### 3. Geographic Spread (`geographic_spread`)
Tries to use regions from different geographic areas consecutively.

### 4. Latency Based (`latency_based`)
Prefers regions with lower average latency.

### 5. Load Balanced (`load_balanced`)
Considers success rate, latency, and VPN availability to select optimal region.

## Usage Examples

### Basic Usage (Environment Variables)
```typescript
// VPN will be automatically enabled if ENABLE_VPN=true
const provider = getProvider(LLMEngine.OPENAI);
const result = await provider.generateResponseText(query, company);
```

### Programmatic VPN Usage
```typescript
import { getVPNProvider, getProviderWithRegion } from '@/lib/providers/factory';

// Get a VPN-enabled provider
const vpnProvider = getVPNProvider(LLMEngine.OPENAI);
const result = await vpnProvider.generateResponseText(query, company);

// Use a specific region
const usEastProvider = getProviderWithRegion(LLMEngine.OPENAI, 'us-east');
const result = await usEastProvider.generateResponseText(query, company);
```

### Multi-Region Requests
```typescript
import { getMultiRegionProviders } from '@/lib/providers/factory';

// Get providers for multiple regions
const providers = getMultiRegionProviders(
  LLMEngine.OPENAI, 
  ['us-east', 'eu-west', 'ap-southeast']
);

// Make requests from different regions
const results = await Promise.all(
  providers.map(provider => provider.generateResponseText(query, company))
);
```

## VPN Status and Monitoring

### Check VPN Status
```typescript
import { getVPNStatus } from '@/lib/providers/factory';

const status = await getVPNStatus();
console.log('VPN Status:', status);
```

### Test VPN Connectivity
```typescript
import { testVPNConnectivity } from '@/lib/providers/factory';

const healthResults = await testVPNConnectivity();
console.log('VPN Health:', healthResults);
```

### API Endpoints

#### Get VPN Status
```bash
GET /api/vpn/status
GET /api/vpn/status?test=true  # Include connectivity test
```

#### Test VPN Connectivity
```bash
POST /api/vpn/status
{
  "action": "test_connectivity"
}
```

#### Get Region Statistics
```bash
POST /api/vpn/status
{
  "action": "get_region_stats"
}
```

#### Run Health Checks
```bash
POST /api/vpn/status
{
  "action": "health_check"
}
```

## VPN Provider Setup

### Supported Protocols
- HTTP/HTTPS Proxy
- SOCKS4/SOCKS5 Proxy

### Recommended VPN Providers
- **Commercial VPN Services**: NordVPN, ExpressVPN, Surfshark
- **Dedicated Proxy Services**: Bright Data, Oxylabs, Smartproxy
- **Cloud-Based**: AWS VPN, Google Cloud VPN, Azure VPN

### Configuration Tips

1. **Multiple Endpoints**: Configure multiple VPN endpoints per region for redundancy
2. **Authentication**: Use username/password authentication for HTTP/SOCKS proxies
3. **Load Balancing**: Enable multiple regions for better performance
4. **Health Monitoring**: The system automatically tracks VPN health and latency

## Troubleshooting

### Common Issues

1. **VPN Connection Failures**
   - Check VPN credentials and endpoints
   - Verify network connectivity
   - Review firewall settings

2. **Slow Performance**
   - Choose regions with lower latency
   - Use `latency_based` strategy
   - Check VPN provider performance

3. **API Rate Limits**
   - Distribute requests across more regions
   - Use `geographic_spread` strategy
   - Monitor request patterns

### Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check the console for VPN request logs:
```
VPN request successful: us-east-1 (us-east) - 250ms
VPN request failed: eu-west-1 - 5000ms
```

## Security Considerations

1. **Credentials**: Store VPN credentials securely in environment variables
2. **Encryption**: Use HTTPS VPN endpoints when possible
3. **Authentication**: Enable authentication for all VPN connections
4. **Monitoring**: Regularly check VPN health and performance
5. **Access Control**: Restrict VPN access to authorized users only

## Performance Optimization

1. **Region Selection**: Choose regions close to AI provider data centers
2. **Caching**: Enable connection pooling for better performance
3. **Timeout Settings**: Adjust timeout values based on your needs
4. **Health Checks**: Regular health checks ensure optimal performance

## Support

For issues or questions:
1. Check the VPN status endpoint: `/api/vpn/status`
2. Review the debug logs
3. Test individual VPN endpoints
4. Consult your VPN provider's documentation 