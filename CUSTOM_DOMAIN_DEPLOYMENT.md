# 🌐 Custom Domain Deployment Guide for SecureContract Pro

This guide provides step-by-step instructions for deploying SecureContract Pro with your own custom domain on various platforms, avoiding platform-specific URLs.

## 📋 Prerequisites

- A registered domain name (e.g., `yourcompany.com`, `contracts.yourcompany.com`)
- Access to your domain's DNS settings
- GitHub account with your repository

## 🚀 Platform-Specific Deployment Instructions

### 1. Vercel Deployment with Custom Domain

#### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy the project
vercel --prod
```

#### Step 2: Add Custom Domain
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain (e.g., `contracts.yourcompany.com`)
5. Follow the DNS configuration instructions provided by Vercel

#### Step 3: DNS Configuration
Add these DNS records to your domain:
```
Type: CNAME
Name: contracts (or your subdomain)
Value: cname.vercel-dns.com
```

### 2. Netlify Deployment with Custom Domain

#### Step 1: Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy the project
netlify deploy --prod --dir=dist
```

#### Step 2: Add Custom Domain
1. Go to your Netlify dashboard
2. Select your site
3. Go to "Domain settings"
4. Click "Add custom domain"
5. Enter your domain (e.g., `contracts.yourcompany.com`)

#### Step 3: DNS Configuration
Add these DNS records:
```
Type: CNAME
Name: contracts
Value: your-site-name.netlify.app
```

### 3. AWS Amplify with Custom Domain

#### Step 1: Deploy to AWS Amplify
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Configure build settings (amplify.yml is already included)
5. Deploy

#### Step 2: Add Custom Domain
1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain name
4. Follow the SSL certificate setup

#### Step 3: DNS Configuration
Add the provided CNAME records to your DNS:
```
Type: CNAME
Name: contracts
Value: your-amplify-domain.amplifyapp.com
```

### 4. DigitalOcean App Platform

#### Step 1: Deploy to DigitalOcean
1. Go to DigitalOcean App Platform
2. Create a new app from GitHub
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### Step 2: Add Custom Domain
1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS as instructed

### 5. Firebase Hosting with Custom Domain

#### Step 1: Setup Firebase
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

#### Step 2: Add Custom Domain
```bash
# Add custom domain
firebase hosting:channel:deploy live --only hosting
```

## 🔧 Environment Configuration for Production

### Environment Variables
Create a `.env.production` file:
```env
VITE_APP_NAME=SecureContract Pro
VITE_APP_URL=https://contracts.yourcompany.com
VITE_SOLANA_CLUSTER=mainnet-beta
VITE_API_URL=https://api.contracts.yourcompany.com
```

### Build Configuration
Update your `package.json` scripts:
```json
{
  "scripts": {
    "build:production": "NODE_ENV=production vite build",
    "preview:production": "vite preview --host"
  }
}
```

## 🛡️ Security Best Practices

### SSL/TLS Certificate
- All platforms provide free SSL certificates
- Ensure HTTPS redirect is enabled
- Use HSTS headers for enhanced security

### DNS Security
```
# Add these DNS records for security
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"

Type: CAA  
Name: @
Value: 0 issuewild "letsencrypt.org"
```

### Content Security Policy
Add to your hosting platform's headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.devnet.solana.com https://api.mainnet-beta.solana.com;
```

## 📊 Performance Optimization

### CDN Configuration
- Enable CDN on your hosting platform
- Configure caching rules for static assets
- Use compression (gzip/brotli)

### Monitoring Setup
```bash
# Add performance monitoring
npm install @vercel/analytics
# or
npm install @netlify/plugin-lighthouse
```

## 🔄 CI/CD Pipeline

### GitHub Actions for Automated Deployment
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:production
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🎯 Domain Recommendations

### Professional Domain Options
- `contracts.yourcompany.com` - Subdomain approach
- `yourcompany-contracts.com` - Dedicated domain
- `secure.yourcompany.com` - Security-focused subdomain

### SEO-Friendly URLs
- Use HTTPS everywhere
- Implement proper redirects
- Add structured data markup
- Create XML sitemap

## 📞 Support and Troubleshooting

### Common Issues
1. **DNS Propagation**: Can take 24-48 hours
2. **SSL Certificate**: May take a few minutes to provision
3. **Build Failures**: Check environment variables and dependencies

### Verification Steps
```bash
# Check DNS propagation
nslookup contracts.yourcompany.com

# Test SSL certificate
curl -I https://contracts.yourcompany.com

# Verify redirects
curl -I http://contracts.yourcompany.com
```

## 🎉 Go Live Checklist

- [ ] Custom domain configured and verified
- [ ] SSL certificate active
- [ ] DNS records propagated
- [ ] Environment variables set for production
- [ ] Performance monitoring enabled
- [ ] Backup and monitoring systems in place
- [ ] SEO meta tags verified
- [ ] Social media sharing tested

Your SecureContract Pro platform is now live on your custom domain! 🚀
