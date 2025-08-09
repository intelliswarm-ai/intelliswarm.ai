# 🚀 AWS Deployment Guide for IntelliSwarm.ai

## **Overview**
This guide will help you deploy your Angular website to AWS using S3 for static hosting, CloudFront for CDN, Route 53 for domain management, and GitHub Actions for automatic deployment.

## **Architecture**
```
GitHub → GitHub Actions → AWS S3 → CloudFront → Route 53 → intelliswarm.ai
```

---

## **Phase 1: AWS Infrastructure Setup**

### **1.1 Create AWS Account & IAM User**
1. **Sign up for AWS** (if not already done)
2. **Create IAM User for GitHub Actions:**
   ```bash
   # Create IAM User: github-actions-user
   # Attach policies: AmazonS3FullAccess, CloudFrontFullAccess, Route53FullAccess
   # Generate Access Keys (save securely)
   ```

### **1.2 Create S3 Bucket**
1. **Create S3 Bucket:**
   - Bucket name: `intelliswarm-website`
   - Region: `us-east-1` (required for CloudFront)
   - Block all public access: `Disabled`
   - Bucket versioning: `Enabled`

2. **Configure S3 Bucket Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::intelliswarm-website/*"
       }
     ]
   }
   ```

3. **Enable Static Website Hosting:**
   - Index document: `index.html`
   - Error document: `index.html` (for Angular routing)

### **1.3 Create CloudFront Distribution**
1. **Create CloudFront Distribution:**
   - Origin domain: `intelliswarm-website.s3.amazonaws.com`
   - Origin path: `/`
   - Viewer protocol policy: `Redirect HTTP to HTTPS`
   - Default root object: `index.html`
   - Error pages: Redirect 403/404 to `/index.html` (200)

2. **Configure Cache Behaviors:**
   - Path pattern: `/*`
   - TTL: `0` (for Angular app)
   - Compress objects: `Yes`

### **1.4 Create Route 53 Hosted Zone**
1. **Create Hosted Zone:**
   - Domain name: `intelliswarm.ai`
   - Type: `Public hosted zone`

2. **Note the NS records** (you'll need these for domain registrar)

---

## **Phase 2: Domain & SSL Configuration**

### **2.1 Configure Domain Registrar**
1. **Update Nameservers** at your domain registrar:
   - Use the 4 NS records from Route 53
   - Wait 24-48 hours for propagation

### **2.2 Create Route 53 Records**
1. **Create A Record:**
   - Name: `@` (root domain)
   - Type: `A`
   - Alias: `Yes`
   - Route traffic to: `CloudFront distribution`

2. **Create A Record for www:**
   - Name: `www`
   - Type: `A`
   - Alias: `Yes`
   - Route traffic to: `CloudFront distribution`

### **2.3 SSL Certificate (Automatic via CloudFront)**
- CloudFront automatically provides SSL certificates
- No additional configuration needed

---

## **Phase 3: GitHub Actions Automation**

### **3.1 Add AWS Credentials to GitHub**
1. **Go to GitHub Repository Settings → Secrets and variables → Actions**
2. **Add Repository Secrets:**
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET=intelliswarm-website
   CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
   ```

### **3.2 Create GitHub Actions Workflow**
The workflow file is already created at `.github/workflows/deploy.yml`

---

## **Phase 4: Monitoring & Maintenance**

### **4.1 CloudWatch Monitoring**
- Set up CloudWatch alarms for:
  - 4xx/5xx error rates
  - Response time thresholds
  - Cost monitoring

### **4.2 Regular Maintenance**
- Monitor CloudFront cache hit rates
- Review S3 storage costs
- Update dependencies regularly
- Monitor domain expiration

---

## **Deployment Commands**

### **Manual Deployment (if needed):**
```bash
# Build the project
npm run build

# Sync to S3
aws s3 sync dist/website s3://intelliswarm-website --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### **Check Deployment Status:**
```bash
# Check S3 contents
aws s3 ls s3://intelliswarm-website --recursive

# Check CloudFront status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

---

## **Cost Estimation**
- **S3 Storage**: ~$0.023/GB/month
- **CloudFront**: ~$0.085/GB (first 10TB)
- **Route 53**: ~$0.50/month per hosted zone
- **Data Transfer**: ~$0.09/GB (outbound)

**Estimated monthly cost**: $5-15 (depending on traffic)

---

## **Troubleshooting**

### **Common Issues:**
1. **CORS errors**: Check S3 bucket policy
2. **404 on refresh**: Ensure CloudFront error pages redirect to index.html
3. **SSL issues**: Verify CloudFront viewer protocol policy
4. **Domain not resolving**: Check nameserver propagation (24-48 hours)

### **Useful Commands:**
```bash
# Test S3 website
curl http://intelliswarm-website.s3-website-us-east-1.amazonaws.com

# Test CloudFront
curl -I https://intelliswarm.ai

# Check DNS propagation
nslookup intelliswarm.ai
dig intelliswarm.ai
```

---

## **Next Steps**
1. ✅ Set up AWS infrastructure
2. ✅ Configure domain and SSL
3. ✅ Set up GitHub Actions
4. ✅ Test deployment
5. ✅ Monitor performance
6. ✅ Set up alerts and monitoring

**Need help?** Check AWS documentation or contact AWS support for infrastructure issues.
