const cartItems = document.getElementById("cartItems");
const emptyCart = document.getElementById("emptyCart");
const subtotalDisplay = document.getElementById("subtotal");
const totalDisplay = document.getElementById("total");
const checkoutButton = document.getElementById("checkoutButton");

// Четем истинските добавени продукти от браузъра
let cart = JSON.parse(localStorage.getItem("wondersci_cart")) || [];

function saveCart() {
  localStorage.setItem("wondersci_cart", JSON.stringify(cart));
}

function formatPrice(price) {
  return price.toFixed(2).replace(".", ",") + " лв.";
}

function renderCart() {
  cartItems.replaceChildren();

  const isEmpty = cart.length === 0;

  emptyCart.hidden = !isEmpty;
  checkoutButton.disabled = isEmpty;

  cart.forEach(product => {
    const item = document.createElement("article");
    item.className = "cart-item";

    const details = document.createElement("div");

    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = product.name;

    const price = document.createElement("div");
    price.className = "item-price";
    price.textContent = formatPrice(product.price) + " за брой";

    const controls = document.createElement("div");
    controls.className = "item-controls";

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Брой: ";

    const quantity = document.createElement("input");
    quantity.className = "quantity";
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "99";
    quantity.step = "1";
    quantity.value = product.quantity;
    quantity.setAttribute(
      "aria-label",
      "Количество за " + product.name
    );

    quantity.addEventListener("change", () => {
      const newQuantity = Number(quantity.value);

      if (!Number.isInteger(newQuantity) ||
          newQuantity < 1 ||
          newQuantity > 99) {
        quantity.value = product.quantity;
        return;
      }

      product.quantity = newQuantity;
      saveCart();
      renderCart();
    });

    quantityLabel.appendChild(quantity);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Премахни";

    removeButton.addEventListener("click", () => {
      cart = cart.filter(item => item.id !== product.id);
      saveCart();
      renderCart();
    });

    controls.append(quantityLabel, removeButton);
    details.append(name, price, controls);

    const itemTotal = document.createElement("div");
    itemTotal.className = "item-total";
    itemTotal.textContent = formatPrice(
      product.price * product.quantity
    );

    item.append(details, itemTotal);
    cartItems.appendChild(item);
  });

  const subtotal = cart.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  subtotalDisplay.textContent = formatPrice(subtotal);
  totalDisplay.textContent = formatPrice(subtotal);
}

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) return;

  window.location.href = "./poruchvane.html";
});

renderCart();
