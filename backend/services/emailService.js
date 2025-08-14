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
    subject: 'Booking Confirmation - BookMyCinema',
    html: `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="900" style="background-color: #1f2025; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <!-- Left QR Section -->
                      <td width="33%" style="background-color: white; padding: 30px; text-align: center; vertical-align: top;">
                        <div style="margin-bottom: 20px;">
                          <h2 style="color: #e50914; margin: 0; font-size: 24px; font-weight: 600;">BookMyCinema</h2>
                          <p style="color: #000; margin: 10px 0 0 0; font-size: 14px; font-weight: 600;">Digital Ticket</p>
                        </div>
                        <table cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 12px; margin: 0 auto 20px auto;">
                          <tr>
                            <td style="width: 150px; height: 150px; background: #000; color: white; text-align: center; vertical-align: middle; font-size: 12px; line-height: 1.2;">QR CODE<br>${ticketId}</td>
                          </tr>
                        </table>
                        <div style="text-align: center;">
                          <span style="background: #007bff; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">🎫 ${ticketId}</span>
                          <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">Scan for entry</p>
                        </div>
                      </td>
                      
                      <!-- Right Details Section -->
                      <td width="67%" style="background-color: #1f2025; color: white; padding: 30px; vertical-align: top;">
                        <div style="margin-bottom: 25px;">
                          <div style="margin-bottom: 10px;">
                            <span style="color: #ffc107; margin-right: 8px; font-size: 20px;">🎬</span>
                            <span style="color: white; font-size: 24px; font-weight: bold;">${booking.show.movie.title}</span>
                          </div>
                          <div>
                            <span style="background: #ffc107; color: #000; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; margin-right: 10px;">Movie</span>
                            <span style="color: #ffc107; font-size: 14px;">⭐ ${booking.show?.movie?.rating || '8.5'}</span>
                          </div>
                        </div>
                        
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td width="50%" style="padding-right: 15px; vertical-align: top;">
                              <div style="margin-bottom: 20px;">
                                <div style="margin-bottom: 8px;">
                                  <span style="color: #17a2b8; margin-right: 8px;">📍</span>
                                  <span style="color: #ccc; font-size: 14px; font-weight: bold;">Theater</span>
                                </div>
                                <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">${booking.show.theater.name}</p>
                                <small style="color: rgba(255,255,255,0.7); font-size: 12px;">Screen ${booking.show?.screenNumber || booking.show?.theater?.screen || '1'}</small>
                              </div>
                              
                              <div>
                                <div style="margin-bottom: 8px;">
                                  <span style="color: #28a745; margin-right: 8px;">🪑</span>
                                  <span style="color: #ccc; font-size: 14px; font-weight: bold;">Seats</span>
                                </div>
                                <div>
                                  ${booking.seats.map(seat => `<span style="background: #28a745; color: white; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-right: 5px; margin-bottom: 5px; display: inline-block;">${seat}</span>`).join('')}
                                </div>
                              </div>
                            </td>
                            
                            <td width="50%" style="padding-left: 15px; vertical-align: top;">
                              <div style="margin-bottom: 20px;">
                                <div style="margin-bottom: 8px;">
                                  <span style="color: #ffc107; margin-right: 8px;">📅</span>
                                  <span style="color: #ccc; font-size: 14px; font-weight: bold;">Show Date</span>
                                </div>
                                <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">${booking.show.showDate ? new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                                <small style="color: rgba(255,255,255,0.7); font-size: 12px;">${booking.show.showDate ? new Date(booking.show.showDate).toLocaleDateString('en-US', { weekday: 'long' }) : ''}</small>
                              </div>
                              
                              <div>
                                <div style="margin-bottom: 8px;">
                                  <span style="color: #17a2b8; margin-right: 8px;">🕐</span>
                                  <span style="color: #ccc; font-size: 14px; font-weight: bold;">Show Time</span>
                                </div>
                                <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">${booking.show.showTime || 'N/A'}</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="border-top: 1px solid rgba(255,255,255,0.25); margin-top: 25px; padding-top: 20px;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="60%" style="vertical-align: middle;">
                                <span style="color: rgba(255,255,255,0.7); font-size: 16px;">Total Amount:</span><br>
                                <span style="color: #ffc107; font-size: 24px; font-weight: bold;">₹${booking.totalAmount}</span>
                              </td>
                              <td width="40%" style="text-align: right; vertical-align: middle;">
                                <span style="background: #28a745; color: white; padding: 8px 20px; border-radius: 15px; font-weight: bold; font-size: 14px;">CONFIRMED</span>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background: rgba(255,255,255,0.05); padding: 20px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Please arrive 15 minutes before the show time.</p>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Booking ID: <strong style="color: #ffc107;">${booking._id}</strong></p>
                  <p style="color: rgba(255,255,255,0.7); margin: 15px 0 0 0; font-size: 14px;">Thank you for choosing BookMyCinema!</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendBookingConfirmation };