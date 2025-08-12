document.addEventListener('DOMContentLoaded', function () {

  const contactBtn = document.getElementById('contactBtn');
  const contactModal = document.getElementById('contactModal');
  const closeContactModal = document.getElementById('closeContactModal');

  if (contactBtn && contactModal && closeContactModal) {
    contactBtn.addEventListener('click', function(e) {
      e.preventDefault();
      contactModal.style.display = 'flex';
      contactModal.setAttribute('aria-hidden', 'false');
    });
    closeContactModal.addEventListener('click', function() {
      contactModal.style.display = 'none';
      contactModal.setAttribute('aria-hidden', 'true');
    });
    contactModal.addEventListener('click', function(e) {
      if (e.target === contactModal) {
        contactModal.style.display = 'none';
        contactModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  const form = document.getElementById('bookingForm');
  const msg = document.getElementById('formMessage');
  const modal = document.getElementById('priceModal');
  const requestBtn = document.getElementById('requestQuoteBtn');
  const closeBtn = modal.querySelector('.close');
  const continueBtn = document.getElementById('continueBooking');

  requestBtn.addEventListener('click', function(e) {
    e.preventDefault();
    modal.setAttribute('aria-hidden', 'false');
  });

  closeBtn.addEventListener('click', function() {
    modal.setAttribute('aria-hidden', 'true');
  });
  window.addEventListener('click', function(e) {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });
  continueBtn.addEventListener('click', function() {
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('name').scrollIntoView({ behavior: 'smooth' });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    msg.textContent = 'Sending...';

    const formData = new FormData(form);

    if (!formData.get('name') || !formData.get('phone')) {
      msg.textContent = 'Please enter name and phone.';
      return;
    }

    try {
      const fileInput = document.getElementById('receipt');
      let receiptMeta = null;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const fd = new FormData();
        fd.append('file', fileInput.files[0], fileInput.files[0].name);
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const upJson = await upRes.json();
        if (!upRes.ok) {
          msg.textContent = upJson.error || 'Failed to upload receipt';
          return;
        }
        receiptMeta = {
          url: upJson.url,
          fileName: upJson.fileName,
          fileSize: upJson.fileSize
        };
      }

      const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value || null,
        arrival: document.getElementById('arrival').value || null,
        notes: document.getElementById('notes').value || null,
        receipt_file_name: receiptMeta ? receiptMeta.fileName : null,
        receipt_file_size: receiptMeta ? receiptMeta.fileSize : null,
        receipt_url: receiptMeta ? receiptMeta.url : null
      };
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        msg.textContent = 'Booking sent successfully! We will contact you soon.';
        form.reset();
      } else {
        msg.textContent = result.error || 'Error submitting the form.';
      }
    } catch (err) {
      console.error(err);
      msg.textContent = 'Failed to reach server. Try again later.';
    }
  });
});