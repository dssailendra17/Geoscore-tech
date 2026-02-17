/**
 * Invoice PDF Generator
 * 
 * Generates professional PDF invoices for subscriptions and payments
 * Uses PDFKit for PDF generation
 */

import PDFDocument from 'pdfkit';
import { storage } from '../storage';
import type { Invoice, Brand, Subscription } from '@shared/schema';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoice: Invoice;
  brand: Brand;
  subscription?: Subscription;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
    phone: string;
    gst?: string;
  };
}

/**
 * Format currency in INR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  // Fetch invoice data
  const invoice = await storage.getInvoice(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const brand = await storage.getBrand(invoice.brandId);
  if (!brand) {
    throw new Error('Brand not found');
  }

  const subscription = invoice.subscriptionId 
    ? await storage.getSubscription(invoice.subscriptionId)
    : undefined;

  const companyInfo = {
    name: 'GeoScore Analytics Pvt Ltd',
    address: '123 Tech Park, Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    zip: '560100',
    country: 'India',
    email: 'billing@geoscore.ai',
    phone: '+91-80-12345678',
    gst: '29ABCDE1234F1Z5',
  };

  const data: InvoiceData = {
    invoice,
    brand,
    subscription,
    companyInfo,
  };

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(companyInfo.name, 50, 80)
        .text(companyInfo.address, 50, 95)
        .text(`${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}`, 50, 110)
        .text(companyInfo.country, 50, 125)
        .text(`Email: ${companyInfo.email}`, 50, 140)
        .text(`Phone: ${companyInfo.phone}`, 50, 155);

      if (companyInfo.gst) {
        doc.text(`GST: ${companyInfo.gst}`, 50, 170);
      }

      // Invoice details (right side)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Number:', 350, 80)
        .font('Helvetica')
        .text(invoice.id.slice(0, 12).toUpperCase(), 460, 80);

      doc
        .font('Helvetica-Bold')
        .text('Invoice Date:', 350, 95)
        .font('Helvetica')
        .text(formatDate(invoice.createdAt || new Date()), 460, 95);

      if (invoice.paidAt) {
        doc
          .font('Helvetica-Bold')
          .text('Payment Date:', 350, 110)
          .font('Helvetica')
          .text(formatDate(invoice.paidAt), 460, 110);
      }

      doc
        .font('Helvetica-Bold')
        .text('Status:', 350, 125)
        .font('Helvetica')
        .fillColor(invoice.status === 'paid' ? 'green' : 'red')
        .text(invoice.status.toUpperCase(), 460, 125)
        .fillColor('black');

      // Bill to section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, 210);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(brand.name, 50, 230)
        .text(brand.domain, 50, 245);

      // Horizontal line
      doc
        .moveTo(50, 280)
        .lineTo(550, 280)
        .stroke();

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, 300)
        .text('Period', 250, 300)
        .text('Amount', 450, 300, { align: 'right' });

      // Horizontal line
      doc
        .moveTo(50, 320)
        .lineTo(550, 320)
        .stroke();

      // Table content
      const description = subscription 
        ? `GeoScore ${subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)} Plan`
        : 'GeoScore Service';

      const period = subscription
        ? `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`
        : formatDate(invoice.createdAt || new Date());

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(description, 50, 340)
        .text(period, 250, 340)
        .text(formatCurrency(invoice.amount), 450, 340, { align: 'right' });

      // Horizontal line
      doc
        .moveTo(50, 370)
        .lineTo(550, 370)
        .stroke();

      // Subtotal
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Subtotal:', 350, 390)
        .text(formatCurrency(invoice.amount), 450, 390, { align: 'right' });

      // GST (18%)
      const gstAmount = invoice.amount * 0.18;
      doc
        .text('GST (18%):', 350, 410)
        .text(formatCurrency(gstAmount), 450, 410, { align: 'right' });

      // Total
      const total = invoice.amount + gstAmount;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', 350, 440)
        .text(formatCurrency(total), 450, 440, { align: 'right' });

      // Payment info
      if (invoice.razorpayPaymentId) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text('Payment ID:', 50, 500)
          .text(invoice.razorpayPaymentId, 120, 500);
      }

      if (invoice.razorpayInvoiceId) {
        doc
          .text('Razorpay Invoice ID:', 50, 515)
          .text(invoice.razorpayInvoiceId, 150, 515);
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Thank you for your business!', 50, 700, { align: 'center' })
        .text('This is a computer-generated invoice and does not require a signature.', 50, 715, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Save invoice PDF to file system
 */
export async function saveInvoicePDF(invoiceId: string, outputPath?: string): Promise<string> {
  const pdfBuffer = await generateInvoicePDF(invoiceId);
  
  const defaultPath = path.join(process.cwd(), 'invoices', `${invoiceId}.pdf`);
  const filePath = outputPath || defaultPath;

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filePath, pdfBuffer);

  console.log(`[Invoice] PDF saved: ${filePath}`);
  return filePath;
}

/**
 * Email invoice PDF to customer
 */
export async function emailInvoicePDF(invoiceId: string, recipientEmail: string): Promise<void> {
  const pdfBuffer = await generateInvoicePDF(invoiceId);
  const invoice = await storage.getInvoice(invoiceId);
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // For now, just log
  console.log(`[Invoice] Would email PDF to ${recipientEmail}`);
  console.log(`[Invoice] PDF size: ${pdfBuffer.length} bytes`);

  // Example integration with nodemailer:
  /*
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: 'billing@geoscore.ai',
    to: recipientEmail,
    subject: `Invoice ${invoice.id.slice(0, 12).toUpperCase()}`,
    text: `Please find attached your invoice for GeoScore services.`,
    html: `<p>Please find attached your invoice for GeoScore services.</p>`,
    attachments: [
      {
        filename: `invoice-${invoice.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
  */
}

/**
 * Generate invoice on subscription charge
 */
export async function generateInvoiceForSubscription(
  brandId: string,
  subscriptionId: string,
  amount: number,
  razorpayPaymentId?: string,
  razorpayInvoiceId?: string
): Promise<string> {
  const invoice = await storage.createInvoice({
    brandId,
    subscriptionId,
    amount,
    status: razorpayPaymentId ? 'paid' : 'pending',
    razorpayPaymentId,
    razorpayInvoiceId,
    paidAt: razorpayPaymentId ? new Date() : undefined,
  });

  // Generate PDF
  await saveInvoicePDF(invoice.id);

  // Email to customer
  const brand = await storage.getBrand(brandId);
  if (brand) {
    // TODO: Get actual customer email
    // await emailInvoicePDF(invoice.id, customerEmail);
  }

  return invoice.id;
}
