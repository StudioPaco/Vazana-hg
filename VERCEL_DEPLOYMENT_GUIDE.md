# Vercel Deployment Guide for Vazana-hg

## Step-by-Step Vercel Free Tier Setup

### Step 1: Create Vercel Account
**Direct Link**: https://vercel.com/signup
- Click "Continue with GitHub" (recommended) or use email
- If using GitHub, authorize Vercel to access your repositories

### Step 2: Deploy Your Existing Project

**Option A: If your project is already on GitHub/connected to Vercel:**
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your existing "vazana-hg" project
3. Click on the project
4. Go to "Deployments" tab
5. Click "Redeploy" to deploy latest changes

**Option B: If you need to push latest changes first:**
1. In your local project directory, commit your changes:
   ```bash
   git add .
   git commit -m "Updated invoice system and fixed job creation"
   git push origin main
   ```
2. Vercel will automatically deploy the new changes
3. Check deployment status at: https://vercel.com/dashboard

**Option C: If project not connected to Git yet:**
1. Connect your local folder to GitHub:
   ```bash
   git remote add origin https://github.com/your-username/vazana-hg.git
   git push -u origin main
   ```
2. Then import at: https://vercel.com/new

### Step 3: Configure Environment Variables
In the Vercel import screen:
1. Expand "Environment Variables" section
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cztzqiaxlilpsdkxrcqo.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at https://your-project-name.vercel.app

### Step 5: Set Up Custom Domain (Optional)
**Direct Link**: https://vercel.com/dashboard
1. Go to your project dashboard
2. Click "Domains" tab
3. Add your custom domain if you have one

## Free Tier Limits (Very Generous)
- 100GB bandwidth/month
- Unlimited projects
- Automatic HTTPS
- Global CDN
- Serverless functions

## Alternative: If you don't want to use GitHub
**Direct Link**: https://vercel.com/new/clone
- Use Vercel CLI instead
- Install: `npm i -g vercel`
- Run: `vercel` in your project directory