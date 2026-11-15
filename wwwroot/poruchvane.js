const cart = JSON.parse(localStorage.getItem("wondersci_cart")) || [];

if (cart.length === 0) {
  window.location.href = "./katalog.html";
}

const summaryDiv = document.getElementById("orderSummaryItems");
const totalEl = document.getElementById("orderTotal");
const orderForm = document.getElementById("orderForm");
const submitBtn = document.getElementById("submitOrderBtn");

function formatPrice(price) {
  return price.toFixed(2).replace(".", ",") + " лв.";
}

let total = 0;
cart.forEach(item => {
  const itemSum = item.price * item.quantity;
  total += itemSum;

  const p = document.createElement("p");
  p.textContent = `${item.name} x ${item.quantity} бр. — ${formatPrice(itemSum)}`;
  summaryDiv.appendChild(p);
});

totalEl.textContent = formatPrice(total);

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Изпращане...";

  const orderData = {
    customerName: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    totalPrice: total,
    items: cart
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      localStorage.removeItem("wondersci_cart");
      alert("Благодарим! Поръчката ти беше приета успешно!");
      window.location.href = "./poruchki.html";
    } else {
      throw new Error("Грешка от сървъра");
    }
  } catch (err) {
    alert("Възникна грешка при изпращането. Опитай отново.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Потвърди поръчката";
  }
});
