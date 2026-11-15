
const cartItems = document.getElementById("cartItems");
const emptyCart = document.getElementById("emptyCart");
const subtotalDisplay = document.getElementById("subtotal");
const totalDisplay = document.getElementById("total");
const checkoutButton = document.getElementById("checkoutButton");

// Примерни продукти за първоначалния дизайн.
// По-късно ще свържем количката с каталога.
let cart = [
  {
    id: 1,
    name: "Комплект „Малък химик“",
    price: 12.90,
    quantity: 1
  },
  {
    id: 2,
    name: "Комплект „Тайните на растенията“",
    price: 9.90,
    quantity: 2
  }
];

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
      renderCart();
    });

    quantityLabel.appendChild(quantity);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Премахни";

    removeButton.addEventListener("click", () => {
      cart = cart.filter(item => item.id !== product.id);
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

  // Временно пренасочване към страницата за оформяне на поръчка.
  window.location.href = "./poruchki.html";
});

renderCart();
