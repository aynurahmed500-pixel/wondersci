function toggleMenu() {
  var menu = document.getElementById("menu");
  menu.classList.toggle("active");
}

function kolichka() {
  window.location.href = "kolichka.html";
}

const ordersContainer = document.getElementById("ordersContainer");

async function loadOrders() {
  try {
    const response = await fetch("/api/orders");
    const orders = await response.json();

    if (orders.length === 0) {
      ordersContainer.innerHTML = "<p>Все още няма направени поръчки.</p>";
      return;
    }

    ordersContainer.innerHTML = orders.map(order => `
      <article class="order-card">
        <div class="order-header">
          <span>Поръчка №${order.id}</span>
          <span>${Number(order.totalPrice).toFixed(2).replace(".", ",")} лв.</span>
        </div>
        <div class="order-details">
          <p><strong>Клиент:</strong> ${order.customerName}</p>
          <p><strong>Телефон:</strong> ${order.phone}</p>
          <p><strong>Адрес за доставка:</strong> ${order.address}</p>
          <p><strong>Дата:</strong> ${order.createdAt}</p>
        </div>
      </article>
    `).join("");
  } catch (error) {
    ordersContainer.innerHTML = "<p>Грешка при зареждане на поръчките.</p>";
  }
}

loadOrders();
