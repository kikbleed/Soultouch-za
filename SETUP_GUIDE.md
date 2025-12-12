# Soultouch ZA - Complete Setup Guide

This guide will walk you through setting up the Soultouch ZA e-commerce platform from scratch.

## Step 1: Get Your InstantDB Credentials

1. Go to https://instantdb.com
2. Sign up or log in
3. Your app ID is already set: `7b3c4eaf-7914-416d-9b78-753ca48d2a6a`
4. Get your admin token:
   - Go to your app dashboard
   - Navigate to Settings → Admin Token
   - Copy the admin token

## Step 2: Get Stripe Test Keys

1. Go to https://stripe.com
2. Sign up or log in
3. Switch to "Test mode" (toggle in top right)
4. Go to Developers → API keys
5. Copy:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

## Step 3: Set Up Stripe Webhook (Local Development)

### Option A: Using Stripe CLI (Recommended)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   
   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) that appears in the terminal

### Option B: Skip Webhooks (Testing Only)

If you skip webhooks, payments will still work but:
- Orders won't automatically update after payment
- Inventory won't be committed
- Email confirmations won't be sent

You can manually update order statuses in the admin panel.

## Step 4: Set Up Email (Choose One)

### Option A: Gmail (Easiest for Testing)

1. Enable 2-factor authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use these settings in `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_16_char_app_password
   ```

### Option B: SendGrid (Better for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Use these settings in `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=your_sendgrid_api_key
   ```

### Option C: Skip Email (Testing Only)

Leave email settings blank. The app will log emails to console instead of sending them.

## Step 5: Create Your .env File

Create a file named `.env` in the root directory:

```env
# InstantDB
INSTANTDB_APP_ID=7b3c4eaf-7914-416d-9b78-753ca48d2a6a
INSTANTDB_ADMIN_TOKEN=paste_your_admin_token_here

# Stripe
STRIPE_SECRET_KEY=sk_test_paste_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_paste_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_paste_your_webhook_secret_here

# Email (use your chosen provider settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password_here
EMAIL_FROM=noreply@soultouch.za

# Admin (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=will_generate_in_next_step

# Server
PORT=3000
NODE_ENV=development
```

## Step 6: Generate Admin Password

1. Choose a secure password for the admin panel
2. Generate the hash:
   ```bash
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPasswordHere', 10, (err, hash) => console.log(hash));"
   ```
3. Copy the output (starts with `$2b$10$`)
4. Paste it as the value for `ADMIN_PASSWORD_HASH` in your `.env` file

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Push Schema to InstantDB

This creates the database tables:

```bash
npx instant-cli push-schema --app 7b3c4eaf-7914-416d-9b78-753ca48d2a6a
```

When prompted, confirm the changes.

## Step 9: Seed the Database

```bash
# Add products to database
npm run seed:products

# Add inventory levels
npm run seed:inventory
```

You should see success messages for both commands.

## Step 10: Start the Server

```bash
npm run dev
```

You should see:
```
API server listening on port 3000
```

## Step 11: Test the Application

### Test the Store

1. Open http://localhost:3000
2. Browse products
3. Click on a product to see details
4. Select a size and add to cart
5. Go to cart and proceed to checkout

### Test Checkout

1. Fill in customer information
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC
5. Complete payment

### Test Admin Panel

1. Go to http://localhost:3000/admin/login.html
2. Login with:
   - Username: `admin` (or your `ADMIN_USERNAME`)
   - Password: The password you used in Step 6
3. View dashboard, orders, products, and inventory

## Troubleshooting

### "InstantDB not configured"
- Check that `INSTANTDB_APP_ID` and `INSTANTDB_ADMIN_TOKEN` are set in `.env`
- Verify there are no extra spaces or quotes

### "Stripe not configured"
- Check that all three Stripe keys are set in `.env`
- Verify you're using test mode keys (start with `pk_test_` and `sk_test_`)

### "No products found"
- Run `npm run seed:products`
- Check the console for any error messages

### "Payment succeeded but order not updated"
- Make sure Stripe webhook is running (`stripe listen...`)
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Look for webhook events in Stripe CLI output

### "Email not sending"
- Check SMTP credentials are correct
- Try sending a test email with a simple script
- For Gmail, ensure 2FA is enabled and you're using an app password

### "Admin login not working"
- Verify the password hash was generated correctly
- Try generating a new hash
- Clear browser cookies and try again

## Next Steps

### Customize the Store

1. **Add Your Products**:
   - Edit `products.js` to add your own products
   - Add product images to the `assets/` folder
   - Run `npm run seed:products` again

2. **Adjust Inventory**:
   - Edit default stock levels in `scripts/seed-inventory.js`
   - Or update manually through the admin panel

3. **Customize Styling**:
   - Edit `styles.css` for main store styling
   - Edit `admin/admin-styles.css` for admin panel styling

4. **Update Email Templates**:
   - Edit templates in `email-service.js`
   - Add your logo and branding

### Go to Production

1. **Get Production Keys**:
   - Switch Stripe to live mode and get live keys
   - Set up production webhook endpoint

2. **Configure Production Database**:
   - Use production InstantDB app
   - Push schema to production

3. **Set Up Production Email**:
   - Use a production email service (SendGrid, AWS SES, etc.)
   - Configure SPF/DKIM records for your domain

4. **Deploy**:
   - Deploy to Vercel, Heroku, Railway, or your preferred platform
   - Set all environment variables in your hosting platform
   - Update Stripe webhook URL to your production domain

## Support

If you encounter issues:

1. Check the console for error messages
2. Review the logs in your terminal
3. Check Stripe Dashboard → Developers → Logs
4. Check InstantDB dashboard for query errors
5. Refer to the main README.md for more details

---

Happy selling! 🎉

