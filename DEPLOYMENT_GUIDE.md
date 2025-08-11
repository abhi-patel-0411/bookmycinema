# Deployment Guide

## Backend on Render

1. Go to [render.com](https://render.com) and connect GitHub
2. Create "Web Service" → Select repository → Root: `backend`
3. Settings:
   - Build: `npm install`
   - Start: `npm start`
   - Plan: Free

4. Add Environment Variables:
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

## Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and connect GitHub
2. Import repository → Root: `frontend`
3. Framework: Create React App

4. Add Environment Variables:
```
REACT_APP_API_URL=https://your-backend-name.onrender.com/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3ItdXJjaGluLTYwLmNsZXJrLmFjY291bnRzLmRldiQ
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51RhYZR4N3NRD17DaFW7M17PFyliGDuPSD2wOxjDLS1NS1jQYk5J0tyELmtu1YawnIMQB1IoEZBS7QQPXh09tsHjv00SfIi8hhu
GENERATE_SOURCEMAP=false
```

5. Update `REACT_APP_API_URL` with actual Render URL after backend deployment