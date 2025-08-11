# Complete Deployment Guide

## 1. GitHub Setup

### Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/movie-booking-app.git
git push -u origin main
```

## 2. Backend Deployment (Render)

### Steps:
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect repository: `movie-booking-app`
5. Configure:
   - **Name**: `movie-booking-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Environment Variables (Add in Render Dashboard):
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://cinebook-admin:abhipatel0411@cinebook-cluster.6h5h13x.mongodb.net/cinebook?retryWrites=true&w=majority&appName=cinebook-cluster
JWT_SECRET=movie_booking_secret_key_2024
VITE_CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3ItdXJjaGluLTYwLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_CjubJWqyHxcBKej35QhdPDgiio5owggIdi7aAMFPmq
CLERK_WEBHOOK_SECRET=whsec_cgZk+8ZgHfpxQdxNFf9cdS4eGrY+HOjW
STRIPE_SECRET_KEY=sk_test_51RhYZR4N3NRD17DaEdHCU4vUV2L0LYIrTGFeolXkIFl7EdUv9hB7QCHChjcKFRpTHcgy4GmXhXoLcI2NXNw5acxC00tQ3wweXq
STRIPE_PUBLISHABLE_KEY=pk_test_51RhYZR4N3NRD17DaFW7M17PFyliGDuPSD2wOxjDLS1NS1jQYk5J0tyELmtu1YawnIMQB1IoEZBS7QQPXh09tsHjv00SfIi8hhu
EMAIL_USER=abhiposhiya0104@gmail.com
EMAIL_PASS=pvoe nowq feuy knqi
```

## 3. Frontend Deployment (Vercel)

### Steps:
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import repository: `movie-booking-app`
5. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Environment Variables (Add in Vercel Dashboard):
```
REACT_APP_API_URL=https://movie-booking-backend.onrender.com/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3ItdXJjaGluLTYwLmNsZXJrLmFjY291bnRzLmRldiQ
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51RhYZR4N3NRD17DaFW7M17PFyliGDuPSD2wOxjDLS1NS1jQYk5J0tyELmtu1YawnIMQB1IoEZBS7QQPXh09tsHjv00SfIi8hhu
GENERATE_SOURCEMAP=false
REACT_APP_ENV=production
```

## 4. Post-Deployment

1. **Update API URL**: Replace `movie-booking-backend` with your actual Render service name
2. **Test**: Verify all features work in production
3. **CORS**: Backend automatically handles CORS for your Vercel domain
4. **Webhooks**: Update Clerk/Stripe webhook URLs with your Render backend URL

## 5. Important Notes

- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- MongoDB Atlas is already configured for production
- SSL certificates are automatic on both platforms