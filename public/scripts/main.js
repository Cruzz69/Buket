
document.addEventListener('DOMContentLoaded', () => {
  // ======================== LOGIN ========================
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.querySelector('[name="email"]');
      const passwordInput = document.querySelector('[name="password"]');

      const email = emailInput.value;
      const password = passwordInput.value;

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const redirectPath = await res.text();

        if (res.ok) {
          window.location.href = redirectPath; // e.g. /events
        } else {
          alert(redirectPath || 'Incorrect credentials');
          loginForm.reset();
        }
      } catch (err) {
        alert('Something went wrong. Please try again.');
      }
    });
  }

  // ======================== REGISTER ========================
  const registerForm = document.querySelector('form[action="/register"]');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.text();

        if (res.ok) {
          window.location.href = result || '/login';
        } else {
          alert(result || 'Registration failed.');
        }
      } catch (err) {
        alert('Something went wrong. Try again.');
      }
    });
  }

  // ======================== BOOKING FORM ========================
  const form = document.querySelector('.booking-form form');
  if (form) {
    const quantityInput = form.querySelector('input[name="quantity"]');
    const priceInput = form.querySelector('input[name="price"]');
    const category = form.querySelector('input[name="category"]')?.value?.toLowerCase();
    const summaryButton = form.querySelector('button[type="submit"]');

    // Real-time total price display
    const totalDisplay = document.createElement('div');
    totalDisplay.style.marginTop = '10px';
    totalDisplay.style.fontWeight = 'bold';
    totalDisplay.style.color = '#333';
    summaryButton.before(totalDisplay);

    const updateTotal = () => {
      const qty = parseInt(quantityInput.value) || 0;
      const priceText = priceInput.value.replace(/[^\d]/g, '');
      const price = parseFloat(priceText) || 0;
      const total = qty * price;
      totalDisplay.textContent = `Total: ₹${total.toLocaleString()}`;
    };

    quantityInput.addEventListener('input', updateTotal);
    updateTotal(); // Initialize on load

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const quantity = parseInt(quantityInput.value);
      if (!quantity || quantity < 1 || quantity > 10) {
        alert('Please enter a valid quantity between 1 and 10.');
        return;
      }

      if (category === 'train') {
        const source = form.querySelector('input[name="source"]').value.trim();
        const destination = form.querySelector('input[name="destination"]').value.trim();
        if (!source || !destination) {
          alert('Please fill in both Source and Destination.');
          return;
        }
      }

      const confirmed = confirm('Proceed to summary with the selected details?');
      if (confirmed) {
        form.submit();
      }
    });
  }

  // ======================== DYNAMIC FILLING FOR BOOKING FORM ========================
  const params = new URLSearchParams(window.location.search);
  const fields = ['eventId', 'title', 'category', 'price', 'source', 'destination'];
  fields.forEach(field => {
    const el = document.querySelector(`[name="${field}"]`);
    if (el && params.get(field)) {
      el.value = params.get(field);
    }
  });

  const isTrain = params.get('category')?.toLowerCase() === 'train';
  const trainSection = document.getElementById('train-fields');
  if (trainSection && isTrain) {
    trainSection.style.display = 'block';
  }
});
