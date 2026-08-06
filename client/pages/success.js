// Order success / confirmation page.

async function renderOrderDone() {
  const root = document.getElementById('page-root') || document.getElementById('app');
  if (!root) return;

  const orderNumber = sessionStorage.getItem('lastOrderNumber') || STATE.lastOrderNumber || '—';
  let summary = {};
  try { summary = JSON.parse(sessionStorage.getItem('lastOrderSummary') || '{}'); } catch { summary = {}; }

  root.innerHTML = `
    <section class="page-section">
      <div class="container text-center" style="max-width:560px;margin:0 auto;">
        <div style="font-size:3rem;">🎉</div>
        <h1 class="mt-4">Order Placed!</h1>
        <p class="mt-2">Thank you for shopping with us. Your order number is</p>
        <h2 class="text-accent mt-2">${orderNumber}</h2>

        <div class="card mt-8" style="padding:var(--space-5);text-align:left;">
          ${(summary.items || []).map(i => `<div class="summary-line"><span>${i.name} × ${i.qty}</span></div>`).join('')}
          ${summary.total ? `<div class="summary-line total"><span>Total</span><span>${formatMoney(summary.total)}</span></div>` : ''}
        </div>

        <div class="flex gap-3 justify-center mt-8" style="flex-wrap:wrap;">
          <a href="#/account?tab=orders" class="btn btn-outline">View My Orders</a>
          <a href="#/shop" class="btn btn-outline">Continue Shopping</a>
          <a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      </div>
    </section>
  `;
}
