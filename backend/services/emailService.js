const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmation = async (booking) => {
  const ticketId = booking.ticketId || `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.user.email,
    subject: 'Booking Confirmation - CineBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2025; color: white; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎬 CineBook</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Digital Ticket</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 25px; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 200px;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">${booking.show.movie.title}</h2>
                <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 5px 15px; border-radius: 20px; margin-bottom: 15px;">
                  <span style="color: white; font-size: 12px; font-weight: bold;">${ticketId}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div>
              <h4 style="color: #667eea; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">🎭 Theater</h4>
              <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">${booking.show.theater.name}</p>
              <small style="color: rgba(255,255,255,0.7);">Screen 1</small>
            </div>
            
            <div>
              <h4 style="color: #667eea; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">🎫 Seats</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${booking.seats.map(seat => `<span style="background: #28a745; color: white; padding: 5px 12px; border-radius: 8px; font-weight: bold; font-size: 14px;">${seat}</span>`).join('')}
              </div>
            </div>
            
            <div>
              <h4 style="color: #667eea; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">📅 Show Date</h4>
              <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">${new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div>
              <h4 style="color: #667eea; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">🕐 Show Time</h4>
              <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">${booking.show.showTime}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="color: rgba(255,255,255,0.7);">Total Amount:</span>
              <h3 style="color: #ffc107; margin: 5px 0 0 0;">₹${booking.totalAmount}</h3>
            </div>
            <div style="background: #28a745; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold;">
              CONFIRMED
            </div>
          </div>
          
          <div style="margin-top: 25px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Please arrive 15 minutes before the show time.</p>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Booking ID: <strong>${booking._id}</strong></p>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); padding: 20px; text-align: center;">
          <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">Thank you for choosing CineBook!</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendBookingConfirmation };