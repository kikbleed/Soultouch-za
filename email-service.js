require("dotenv").config();
const nodemailer = require("nodemailer");

// Create reusable transporter
let transporter = null;

function getTransporter() {
    if (!transporter) {
        const config = {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        };

        // Only create transporter if credentials are provided
        if (config.auth.user && config.auth.pass) {
            transporter = nodemailer.createTransport(config);
        } else {
            console.warn("Email service not configured. Set SMTP_USER and SMTP_PASSWORD in .env");
        }
    }
    return transporter;
}

// Send order confirmation email
async function sendOrderConfirmation(orderData) {
    const transport = getTransporter();
    if (!transport) {
        console.log("Email service not configured - skipping order confirmation email");
        return { success: false, error: "Email not configured" };
    }

    try {
        const emailHTML = generateOrderConfirmationHTML(orderData);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || "noreply@soultouch.za",
            to: orderData.customerEmail,
            subject: `Order Confirmation - ${orderData.orderNumber}`,
            html: emailHTML,
        };

        const info = await transport.sendMail(mailOptions);
        console.log("Order confirmation email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Failed to send order confirmation email:", error);
        return { success: false, error: error.message };
    }
}

// Send shipping notification email
async function sendShippingNotification(orderData) {
    const transport = getTransporter();
    if (!transport) {
        console.log("Email service not configured - skipping shipping notification");
        return { success: false, error: "Email not configured" };
    }

    try {
        const emailHTML = generateShippingNotificationHTML(orderData);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || "noreply@soultouch.za",
            to: orderData.customerEmail,
            subject: `Your Order Has Shipped - ${orderData.orderNumber}`,
            html: emailHTML,
        };

        const info = await transport.sendMail(mailOptions);
        console.log("Shipping notification email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Failed to send shipping notification:", error);
        return { success: false, error: error.message };
    }
}

// Send delivery confirmation email
async function sendDeliveryConfirmation(orderData) {
    const transport = getTransporter();
    if (!transport) {
        console.log("Email service not configured - skipping delivery confirmation");
        return { success: false, error: "Email not configured" };
    }

    try {
        const emailHTML = generateDeliveryConfirmationHTML(orderData);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || "noreply@soultouch.za",
            to: orderData.customerEmail,
            subject: `Order Delivered - ${orderData.orderNumber}`,
            html: emailHTML,
        };

        const info = await transport.sendMail(mailOptions);
        console.log("Delivery confirmation email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Failed to send delivery confirmation:", error);
        return { success: false, error: error.message };
    }
}

// Generate order confirmation HTML
function generateOrderConfirmationHTML(orderData) {
    const orderItemsHTML = orderData.items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="font-size: 16px; font-weight: 600; color: #E8E8E8; padding-bottom: 5px;">${item.productName}</td>
                        <td align="right" style="font-size: 16px; font-weight: 700; color: #C4B998;">R${item.price * item.quantity}</td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #B8B8B9;">${item.brand} • Size ${item.size} • Qty ${item.quantity}</td>
                        <td></td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    const deliveryMethod = orderData.deliveryMethod === 'express' 
        ? 'Express Delivery (1–2 days)' 
        : 'Standard Delivery (3–5 days)';

    const deliveryAddress = `${orderData.deliveryAddress}, ${orderData.deliveryCity} ${orderData.deliveryPostalCode}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Soultouch ZA</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #1A1B1D; color: #E8E8E8;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A0A0B; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #1A1B1D; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.35);">
                    <tr>
                        <td style="padding: 40px 30px 30px; text-align: center; background: linear-gradient(135deg, rgba(174, 177, 181, 0.1) 0%, rgba(196, 185, 152, 0.1) 100%);">
                            <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #E8E8E8; letter-spacing: -0.5px;">Soultouch ZA</h1>
                            <p style="margin: 0; font-size: 14px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Order Confirmation</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #B8B8B9;">Order Number</p>
                            <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #C4B998; letter-spacing: 2px;">${orderData.orderNumber}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Customer Name</p>
                                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #E8E8E8;">${orderData.customerName}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #E8E8E8;">Ordered Items</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.06); border-radius: 12px; overflow: hidden;">
                                ${orderItemsHTML}
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 14px; color: #B8B8B9;">Subtotal</td>
                                                <td align="right" style="font-size: 14px; font-weight: 600; color: #E8E8E8;">R${orderData.subtotal}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 14px; color: #B8B8B9;">Delivery</td>
                                                <td align="right" style="font-size: 14px; font-weight: 600; color: #E8E8E8;">R${orderData.deliveryCost}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 0 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 18px; font-weight: 700; color: #C4B998;">Total</td>
                                                <td align="right" style="font-size: 24px; font-weight: 700; color: #C4B998;">R${orderData.total}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(196, 185, 152, 0.1); border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Delivery Method</p>
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #E8E8E8;">${deliveryMethod}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</p>
                                        <p style="margin: 0; font-size: 14px; color: #E8E8E8; line-height: 1.6;">${deliveryAddress}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: rgba(255, 255, 255, 0.06); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 15px; font-size: 12px; color: #B8B8B9; text-align: center; line-height: 1.6;">
                                <strong style="color: #E8E8E8;">Soultouch ZA</strong><br>
                                Premium Sneaker Resale<br>
                                South Africa
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #AEB1B5; text-align: center;">
                                Thank you for your order!
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Generate shipping notification HTML
function generateShippingNotificationHTML(orderData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Shipped - Soultouch ZA</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #1A1B1D; color: #E8E8E8;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A0A0B; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #1A1B1D; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.35);">
                    <tr>
                        <td style="padding: 40px 30px 30px; text-align: center; background: linear-gradient(135deg, rgba(174, 177, 181, 0.1) 0%, rgba(196, 185, 152, 0.1) 100%);">
                            <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #E8E8E8; letter-spacing: -0.5px;">Soultouch ZA</h1>
                            <p style="margin: 0; font-size: 14px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Your Order Has Shipped!</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #B8B8B9;">Order Number</p>
                            <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #C4B998; letter-spacing: 2px;">${orderData.orderNumber}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <p style="margin: 0 0 20px; font-size: 16px; color: #E8E8E8; text-align: center; line-height: 1.6;">
                                Great news, ${orderData.customerName}! Your order is on its way.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(196, 185, 152, 0.1); border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</p>
                                        <p style="margin: 0; font-size: 14px; color: #E8E8E8; line-height: 1.6;">${orderData.deliveryAddress}, ${orderData.deliveryCity} ${orderData.deliveryPostalCode}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: rgba(255, 255, 255, 0.06); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0; font-size: 12px; color: #B8B8B9; text-align: center; line-height: 1.6;">
                                <strong style="color: #E8E8E8;">Soultouch ZA</strong><br>
                                Premium Sneaker Resale<br>
                                South Africa
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Generate delivery confirmation HTML
function generateDeliveryConfirmationHTML(orderData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Delivered - Soultouch ZA</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #1A1B1D; color: #E8E8E8;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A0A0B; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #1A1B1D; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.35);">
                    <tr>
                        <td style="padding: 40px 30px 30px; text-align: center; background: linear-gradient(135deg, rgba(174, 177, 181, 0.1) 0%, rgba(196, 185, 152, 0.1) 100%);">
                            <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #E8E8E8; letter-spacing: -0.5px;">Soultouch ZA</h1>
                            <p style="margin: 0; font-size: 14px; color: #B8B8B9; text-transform: uppercase; letter-spacing: 1px;">Order Delivered!</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #B8B8B9;">Order Number</p>
                            <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #C4B998; letter-spacing: 2px;">${orderData.orderNumber}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <p style="margin: 0 0 20px; font-size: 16px; color: #E8E8E8; text-align: center; line-height: 1.6;">
                                Your order has been delivered! We hope you enjoy your new sneakers, ${orderData.customerName}.
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #B8B8B9; text-align: center; line-height: 1.6;">
                                Thank you for shopping with Soultouch ZA!
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: rgba(255, 255, 255, 0.06); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0; font-size: 12px; color: #B8B8B9; text-align: center; line-height: 1.6;">
                                <strong style="color: #E8E8E8;">Soultouch ZA</strong><br>
                                Premium Sneaker Resale<br>
                                South Africa
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

module.exports = {
    sendOrderConfirmation,
    sendShippingNotification,
    sendDeliveryConfirmation,
};

