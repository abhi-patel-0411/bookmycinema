// Simple Stripe test utility
export const testStripeConnection = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/payment/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100, // Test with ₹100
        currency: 'inr',
        bookingId: 'test_booking'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.clientSecret) {
      console.log('✅ Stripe connection successful');
      console.log('Client Secret:', data.clientSecret);
      return { success: true, data };
    } else {
      console.error('❌ Stripe connection failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error.message };
  }
};

// Test function to call from browser console
window.testStripe = testStripeConnection;