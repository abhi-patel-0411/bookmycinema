/**
 * Utility to apply beautiful styling classes to elements
 */

// Apply beautiful styling to all pages
export const applyBeautifulStyles = () => {
  // Apply to page containers
  document.querySelectorAll('.page-container').forEach(el => {
    el.classList.add('page-container-beautiful');
  });

  // Apply to cards
  document.querySelectorAll('.card').forEach(el => {
    el.classList.add('beautiful-card');
  });

  // Apply to movie cards
  document.querySelectorAll('.movie-card').forEach(el => {
    el.classList.add('movie-card-beautiful');
  });

  // Apply to buttons
  document.querySelectorAll('.btn-primary').forEach(el => {
    el.classList.add('btn-beautiful-primary');
  });

  document.querySelectorAll('.btn-secondary').forEach(el => {
    el.classList.add('btn-beautiful-secondary');
  });

  document.querySelectorAll('.btn-outline-primary').forEach(el => {
    el.classList.add('btn-beautiful-outline');
  });

  // Apply to forms
  document.querySelectorAll('.form-control').forEach(el => {
    el.classList.add('form-control-beautiful');
  });

  document.querySelectorAll('.form-group').forEach(el => {
    el.classList.add('form-group-beautiful');
  });

  document.querySelectorAll('.form-label').forEach(el => {
    el.classList.add('form-label-beautiful');
  });

  // Apply to tables
  document.querySelectorAll('.table').forEach(el => {
    el.classList.add('table-beautiful');
  });

  // Apply to modals
  document.querySelectorAll('.modal-content').forEach(el => {
    el.classList.add('modal-content-beautiful');
  });

  document.querySelectorAll('.modal-header').forEach(el => {
    el.classList.add('modal-header-beautiful');
  });

  document.querySelectorAll('.modal-body').forEach(el => {
    el.classList.add('modal-body-beautiful');
  });

  document.querySelectorAll('.modal-footer').forEach(el => {
    el.classList.add('modal-footer-beautiful');
  });

  // Apply to alerts
  document.querySelectorAll('.alert').forEach(el => {
    el.classList.add('alert-beautiful');
  });

  document.querySelectorAll('.alert-success').forEach(el => {
    el.classList.add('alert-success-beautiful');
  });

  document.querySelectorAll('.alert-danger').forEach(el => {
    el.classList.add('alert-danger-beautiful');
  });

  document.querySelectorAll('.alert-warning').forEach(el => {
    el.classList.add('alert-warning-beautiful');
  });

  // Apply to badges
  document.querySelectorAll('.badge').forEach(el => {
    el.classList.add('badge-beautiful');
  });

  // Apply to specific pages
  document.querySelectorAll('.movies-page').forEach(el => {
    el.classList.add('movies-page-beautiful');
  });

  document.querySelectorAll('.movie-details-page').forEach(el => {
    el.classList.add('movie-details-beautiful');
  });

  document.querySelectorAll('.booking-page').forEach(el => {
    el.classList.add('booking-page-beautiful');
  });

  document.querySelectorAll('.auth-page').forEach(el => {
    el.classList.add('auth-page-beautiful');
  });

  document.querySelectorAll('.admin-page').forEach(el => {
    el.classList.add('admin-page-beautiful');
  });
};

// Apply beautiful styling to specific elements
export const applyBeautifulStylesTo = (selector, beautifulClass) => {
  document.querySelectorAll(selector).forEach(el => {
    el.classList.add(beautifulClass);
  });
};