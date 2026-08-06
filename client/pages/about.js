// About / Contact page.

async function renderAbout() {
  const app = _pageRoot();
  if (!app) return;
  app.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="section-heading scroll-reveal">
          <span class="eyebrow">Our Story</span>
          <h2>About Lumière Salon &amp; Spa</h2>
        </div>
        <div class="grid grid-2 gap-8 scroll-reveal">
          <div>
            <p>Founded in 2015, Lumière Salon &amp; Spa has been Dhaka's destination for premium beauty and wellness experiences. What started as a small studio has grown into a full-service salon offering hair, skin, nail, and massage treatments, delivered by a team of passionate, highly-trained professionals.</p>
            <p class="mt-4">We believe beauty rituals should feel like moments of self-care, not just transactions. That philosophy guides every detail — from our calming interiors to our carefully curated product line.</p>
            <p class="mt-4">Whether you're here for a quick trim or a full bridal transformation, our team is dedicated to making you look and feel your absolute best.</p>
          </div>
          <div class="card-media" style="aspect-ratio:4/3;border-radius:var(--radius-lg);">
            <img src="assets/images/about-salon.svg" alt="About Lumière" onerror="this.style.background='linear-gradient(135deg,var(--color-accent-light),var(--color-border))';this.removeAttribute('src')">
          </div>
        </div>
      </div>
    </section>
    <section class="page-section" style="background:var(--color-bg-alt);">
      <div class="container grid grid-3 gap-6 text-center">
        <div class="scroll-reveal"><h3>12,000+</h3><p>Clients Served</p></div>
        <div class="scroll-reveal"><h3>10 Years</h3><p>Combined Team Experience</p></div>
        <div class="scroll-reveal"><h3>4.8 / 5</h3><p>Average Client Rating</p></div>
      </div>
    </section>
    <section class="page-section">
      <div class="container">
        <div class="section-heading scroll-reveal">
          <span class="eyebrow">Get In Touch</span>
          <h2>Contact Us</h2>
        </div>
        <div class="grid grid-2 gap-8">
          <div class="scroll-reveal">
            <p><strong>Address:</strong> House 12, Road 5, Gulshan 1, Dhaka 1212</p>
            <p class="mt-2"><strong>Phone:</strong> +880 1700-000000</p>
            <p class="mt-2"><strong>Email:</strong> hello@lumieresalon.com</p>
          </div>
          <form id="about-contact-form" class="scroll-reveal">
            <div class="form-group"><input type="text" placeholder="Your name" required></div>
            <div class="form-group"><input type="email" placeholder="Your email" required></div>
            <div class="form-group"><textarea placeholder="Message" required></textarea></div>
            <button class="btn btn-primary" type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  `;
  const form = document.getElementById('about-contact-form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Thanks for reaching out! We will get back to you soon.', 'success');
    form.reset();
  });
}
