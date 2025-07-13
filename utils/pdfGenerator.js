const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

async function generatePDF(user, event, booking) {
  const filePath = path.join(__dirname, `../tickets/ticket-${booking._id}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(22).fillColor('#4a90e2').text('🎟️ Just Buket - Ticket Confirmation', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).fillColor('#000').text(`Name: ${user.username}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Date of Booking: ${booking.dateBooked.toDateString()}`);
  doc.moveDown();
  doc.fontSize(16).fillColor('#333').text('Event Details', { underline: true });
  doc.fontSize(14).text(`Title: ${event.title}`);
  doc.text(`Category: ${event.category}`);
  doc.text(`Date: ${event.date}`);
  doc.text(`Time: ${event.time}`);
  doc.text(`Venue: ${event.venue}`);
  if (event.category === 'train') {
    doc.text(`From: ${booking.source}`);
    doc.text(`To: ${booking.destination}`);
  }
  doc.text(`Seats Booked: ${booking.quantity}`);
  doc.text(`Total Paid: ₹${booking.totalPrice}`);
  doc.moveDown();

  const qrText = `Booking ID: ${booking._id}\nUser: ${user.username}\nEvent: ${event.title}`;
  const qrImage = await QRCode.toDataURL(qrText);
  const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");
  const qrPath = path.join(__dirname, `../tickets/qr-${booking._id}.png`);
  fs.writeFileSync(qrPath, base64Data, 'base64');
  doc.image(qrPath, { fit: [150, 150], align: 'center' });
  fs.unlinkSync(qrPath);

  doc.moveDown();
  doc.fontSize(12).fillColor('#888').text('Thank you for booking with Just Buket!', { align: 'center' });
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = generatePDF;