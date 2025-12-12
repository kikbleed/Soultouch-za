# Soultouch ZA - Full-Stack E-commerce Platform

A modern, full-featured e-commerce platform for premium sneaker resale, built with vanilla JavaScript, Express.js, InstantDB, and Stripe.

## 🚀 Features

### Customer-Facing Features
- **Product Catalog**: Browse premium sneakers from Nike, Puma, and Adidas
- **Real-time Inventory**: See live stock levels and out-of-stock indicators
- **Shopping Cart**: Add products with size selection
- **Secure Checkout**: Stripe payment integration with card processing
- **Order Tracking**: Track orders by order number with real-time status updates
- **Email Notifications**: Automated order confirmations and shipping updates
- **User Authentication**: Magic link authentication via InstantDB

### Admin Features
- **Dashboard**: Overview of sales, orders, and revenue
- **Order Management**: View all orders, update statuses, trigger email notifications
- **Product Management**: Activate/deactivate products
- **Inventory Management**: Update stock levels, view reserved and available quantities

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- InstantDB account (free tier available)
- Stripe account (test mode available)
- SMTP email service (Gmail, SendGrid, etc.)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Soultouch-za
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# InstantDB Configuration
INSTANTDB_APP_ID=7b3c4eaf-7914-416d-9b78-753ca48d2a6a
INSTANTDB_ADMIN_TOKEN=your_admin_token_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@soultouch.za

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$your_bcrypt_hashed_password

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Generate Admin Password Hash

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10, (err, hash) => console.log(hash));"
```

Copy the generated hash to `ADMIN_PASSWORD_HASH` in your `.env` file.

### 5. Push Schema to InstantDB

```bash
npx instant-cli push-schema --app 7b3c4eaf-7914-416d-9b78-753ca48d2a6a
```

### 6. Seed the Database

```bash
# Seed products
npm run seed:products

# Seed inventory
npm run seed:inventory
```

### 7. Configure Stripe Webhook (for Production)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
npm start
```

## 📁 Project Structure

```
Soultouch-za/
├── admin/                      # Admin dashboard pages
│   ├── login.html             # Admin login
│   ├── dashboard.html         # Sales overview
│   ├── orders.html            # Order management
│   ├── products.html          # Product management
│   ├── inventory.html         # Inventory management
│   ├── admin.js               # Shared admin functionality
│   └── admin-styles.css       # Admin-specific styles
├── assets/                     # Product images
├── email/                      # Email templates
├── scripts/                    # Utility scripts
│   ├── seed-products.js       # Seed products to database
│   └── seed-inventory.js      # Seed inventory levels
├── auth.js                     # Client-side authentication
├── cart.js                     # Shopping cart functionality
├── checkout.js                 # Checkout page logic
├── client-db.js                # Client-side database wrapper
├── email-service.js            # Email sending service
├── instant.schema.ts           # InstantDB schema definition
├── instant.perms.ts            # InstantDB permissions
├── instantdb.js                # Server-side InstantDB setup
├── order-summary.js            # Order confirmation page
├── payment.js                  # Stripe payment integration
├── products.js                 # Product data
├── script.js                   # Main frontend logic
├── server.js                   # Express server
├── styles.css                  # Main stylesheet
├── tracking.js                 # Order tracking functionality
└── package.json                # Dependencies and scripts
```

## 🔑 Key Technologies

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (Glassmorphism design)
- **Backend**: Express.js, Node.js
- **Database**: InstantDB (real-time database with auth)
- **Payments**: Stripe (card payments, webhooks)
- **Email**: Nodemailer (SMTP)
- **Authentication**: InstantDB Magic Links

## 📊 Database Schema

### Entities

- **products**: Product catalog with images, sizes, pricing
- **orders**: Customer orders with delivery info
- **orderItems**: Individual items in each order
- **inventory**: Stock levels per product/size
- **$users**: User authentication (managed by InstantDB)

### Relationships

- `orders` → `orderItems` (one-to-many)
- `orderItems` → `products` (many-to-one)
- `inventory` → `products` (many-to-one)

## 🔐 Admin Access

1. Navigate to `/admin/login.html`
2. Use credentials from `.env`:
   - Username: Value of `ADMIN_USERNAME`
   - Password: The password you used to generate `ADMIN_PASSWORD_HASH`

## 💳 Testing Payments

Use Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

Use any future expiry date, any 3-digit CVC, and any postal code.

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

### Other SMTP Providers

- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials from dashboard
- **AWS SES**: Use SMTP credentials from console

## 🚢 Deployment

### Environment Variables

Ensure all environment variables are set in your production environment.

### Stripe Webhooks

1. Create a webhook endpoint in Stripe Dashboard
2. Set URL to: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### InstantDB

The schema and permissions are already configured. Ensure your production app ID and admin token are set correctly.

## 🐛 Troubleshooting

### Products not showing
- Run `npm run seed:products` to populate the database

### Inventory not updating
- Run `npm run seed:inventory` to create inventory records
- Check that products exist before seeding inventory

### Payments failing
- Verify Stripe keys are correct (test vs. live mode)
- Check webhook endpoint is accessible
- Review Stripe Dashboard logs

### Emails not sending
- Verify SMTP credentials
- Check firewall/security settings
- Test with a simple SMTP client first

### Admin login not working
- Verify password hash was generated correctly
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` in `.env`
- Clear browser cookies and try again

## 📝 License

This project is for demonstration purposes.

## 🤝 Support

For issues or questions, please check the documentation or create an issue in the repository.

---

Built with ❤️ for premium sneaker enthusiasts

