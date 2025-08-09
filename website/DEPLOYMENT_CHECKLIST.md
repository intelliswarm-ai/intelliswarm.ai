# 🚀 Quick Deployment Checklist

## **Pre-Deployment Setup**
- [ ] AWS account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Domain `intelliswarm.ai` purchased/owned
- [ ] GitHub repository ready with main branch

## **Phase 1: AWS Infrastructure (5 minutes)**
- [ ] Run deployment script: `chmod +x deploy.sh && ./deploy.sh`
- [ ] Note the CloudFront Distribution ID and Hosted Zone ID from output
- [ ] Note the 4 nameservers from output

## **Phase 2: Domain Configuration (5 minutes)**
- [ ] Go to your domain registrar (GoDaddy, Namecheap, etc.)
- [ ] Update nameservers to the 4 NS records from AWS
- [ ] Wait 24-48 hours for DNS propagation

## **Phase 3: GitHub Actions Setup (5 minutes)**
- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Add these secrets:
  ```
  AWS_ACCESS_KEY_ID=your_access_key
  AWS_SECRET_ACCESS_KEY=your_secret_key
  AWS_REGION=us-east-1
  S3_BUCKET=intelliswarm-website
  CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
  ```

## **Phase 4: Test Deployment**
- [ ] Push to main branch
- [ ] Check GitHub Actions tab for deployment status
- [ ] Visit https://intelliswarm.ai (after DNS propagation)

## **What Happens Automatically**
✅ Website builds on every push to main  
✅ Deploys to S3 bucket  
✅ Invalidates CloudFront cache  
✅ Updates live at intelliswarm.ai  

## **Manual Commands (if needed)**
```bash
# Build locally
npm run build

# Deploy manually
aws s3 sync dist/website s3://intelliswarm-website --delete

# Invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## **Support Files Created**
- `aws-deployment-guide.md` - Detailed step-by-step guide
- `aws-infrastructure.yml` - CloudFormation template
- `deploy.sh` - Automated deployment script
- `.github/workflows/deploy.yml` - GitHub Actions workflow

## **Estimated Time to Complete**
- **Total setup time**: 15-20 minutes
- **DNS propagation**: 24-48 hours
- **First deployment**: Immediate after push

## **Costs**
- **Monthly**: $5-15 (depending on traffic)
- **Setup**: $0 (AWS free tier eligible)

---

**Need help?** Check the detailed guide in `aws-deployment-guide.md`
