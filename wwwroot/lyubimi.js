const favoritesList = document.getElementById("favoritesList");
const emptyFavorites = document.getElementById("emptyFavorites");
const favoritesCount = document.getElementById("favoritesCount");

function getStorageData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        console.error(`Грешка при четене от localStorage за ${key}:`, e);
        return [];
    }
}

let favorites = getStorageData("wondersci_favorites");

function saveFavorites() {
    localStorage.setItem("wondersci_favorites", JSON.stringify(favorites));
}

function formatPrice(price) {
    return (Number(price) || 0).toFixed(2).replace(".", ",") + " лв.";
}

function renderFavorites() {
    if (!favoritesList) return;

    favorites = getStorageData("wondersci_favorites");
    favoritesList.replaceChildren();

    const isEmpty = favorites.length === 0;
    if (emptyFavorites) {
        emptyFavorites.hidden = !isEmpty;
    }
    favoritesList.hidden = isEmpty;

    if (favoritesCount) {
        favoritesCount.textContent =
            favorites.length + (favorites.length === 1 ? " продукт" : " продукта");
    }

    favorites.forEach(product => {
        const card = document.createElement("article");
        card.className = "favorite-card";

        const imageBox = document.createElement("div");
        imageBox.className = "product-image";

        const imgSrc = product.image || "🧪";
        if (imgSrc.startsWith("http") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(imgSrc)) {
            const img = document.createElement("img");
            img.src = imgSrc;
            img.alt = product.name || "Продукт";
            imageBox.append(img);
        } else {
            imageBox.textContent = imgSrc;
            imageBox.setAttribute("aria-hidden", "true");
        }

        const name = document.createElement("h3");
        name.className = "product-name";
        name.textContent = product.name || "Без име";

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "";

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(product.price);

        const buttons = document.createElement("div");
        buttons.className = "card-buttons";

        const addToCartBtn = document.createElement("button");
        addToCartBtn.className = "view-button";
        addToCartBtn.type = "button";
        addToCartBtn.textContent = "🛒 В количката";

        addToCartBtn.addEventListener("click", () => {
            const cart = getStorageData("wondersci_cart");
            const existing = cart.find(item => String(item.id) === String(product.id));
            
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price) || 0,
                    image: product.image || "🧪",
                    quantity: 1
                });
            }
            
            localStorage.setItem("wondersci_cart", JSON.stringify(cart));

            addToCartBtn.textContent = "✓ Добавен";
            window.setTimeout(() => {
                addToCartBtn.textContent = "🛒 В количката";
            }, 1000);
        });

        const removeButton = document.createElement("button");
        removeButton.className = "remove-button";
        removeButton.type = "button";
        removeButton.textContent = "♡ Премахни от любими";

        removeButton.addEventListener("click", () => {
            favorites = favorites.filter(item => String(item.id) !== String(product.id));
            saveFavorites();
            renderFavorites();
        });

        buttons.append(addToCartBtn, removeButton);
        card.append(imageBox, name, description, price, buttons);
        favoritesList.appendChild(card);
    });
}

renderFavorites();
