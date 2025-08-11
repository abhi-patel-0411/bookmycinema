// Initialize Spline
window.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('canvas3d');
  if (canvas) {
    try {
      const spline = new window.Spline.Runtime({
        canvas,
        url: 'https://prod.spline.design/your-spline-url'
      });
    } catch (error) {
      console.error('Error initializing Spline:', error);
    }
  }
});