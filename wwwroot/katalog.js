function toggleMenu() {
    const menu = document.getElementById("menu");
    if (menu) {
        menu.classList.toggle("active");
    }
}

const elements = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
});

elements.forEach(element => {
    observer.observe(element);
});

const productsGrid = document.getElementById("productsGrid");
const productSearch = document.getElementById("productSearch");
const sortProducts = document.getElementById("sortProducts");
const productsCount = document.getElementById("productsCount");
const noProducts = document.getElementById("noProducts");
const categoryButtons = document.querySelectorAll(".category-button");
const resetFilters = document.getElementById("resetFilters");

let products = [];

const categoryNames = {
    chemistry: "Химия",
    nature: "Природа",
    crystals: "Кристали",
    physics: "Физика"
};

let selectedCategory = "all";

function getStorageData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        console.error(`Грешка при четене от localStorage за ${key}:`, e);
        return [];
    }
}

let favorites = getStorageData("wondersci_favorites");
let cart = getStorageData("wondersci_cart");

async function loadProductsFromMySQL() {
    if (!productsGrid) return;

    try {
        const response = await fetch("/products");
        if (!response.ok) {
            throw new Error(`HTTP грешка: ${response.status}`);
        }
        const data = await response.json();

        products = data.map((p, index) => {
            const rawCat = p.category || p.Category || "";
            const catKey = rawCat.toLowerCase();
            const prodName = p.name || p.Name || `Продукт ${index + 1}`;
            
            return {
                id: String(p.id ?? p.Id ?? p.ID ?? p.product_id ?? prodName),
                name: prodName,
                category: catKey,
                categoryName: categoryNames[catKey] || rawCat || "Наука",
                description: p.description || p.Description || "",
                price: Number(p.price ?? p.Price) || 0,
                image: p.image || p.Image || "🧪"
            };
        });

        renderProducts();
    } catch (error) {
        console.error("Грешка при връзка с MySQL:", error);
    }
}

function formatPrice(price) {
    return Number(price).toFixed(2).replace(".", ",") + " лв.";
}

function getVisibleProducts() {
    const searchTerm = productSearch ? productSearch.value.trim().toLowerCase() : "";

    let visibleProducts = products.filter(product => {
        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const searchableText =
            `${product.name} ${product.description} ${product.categoryName}`.toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });

    const sortValue = sortProducts ? sortProducts.value : "default";

    if (sortValue === "price-asc") {
        visibleProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-desc") {
        visibleProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === "name") {
        visibleProducts.sort((a, b) => a.name.localeCompare(b.name, "bg"));
    }

    return visibleProducts;
}

function renderProducts() {
    if (!productsGrid) return;

    productsGrid.replaceChildren();

    const visibleProducts = getVisibleProducts();

    if (productsCount) {
        productsCount.textContent =
            visibleProducts.length +
            (visibleProducts.length === 1 ? " продукт" : " продукта");
    }

    if (noProducts) {
        noProducts.hidden = visibleProducts.length !== 0;
    }
    productsGrid.hidden = visibleProducts.length === 0;

    visibleProducts.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageBox = document.createElement("div");
        imageBox.className = "product-image";

        const imgSrc = product.image || "🧪";
        if (imgSrc.startsWith("http") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(imgSrc)) {
            const img = document.createElement("img");
            img.src = imgSrc;
            img.alt = product.name;
            imageBox.append(img);
        } else {
            const image = document.createElement("span");
            image.textContent = imgSrc;
            image.setAttribute("aria-hidden", "true");
            imageBox.append(image);
        }

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className = "favorite-button";

        const isFavorite = favorites.some(item => String(item.id) === String(product.id));

        favoriteButton.classList.toggle("is-favorite", isFavorite);
        favoriteButton.textContent = isFavorite ? "♥" : "♡";
        favoriteButton.setAttribute(
            "aria-label",
            isFavorite ? "Премахни от любими" : "Добави в любими"
        );

        favoriteButton.addEventListener("click", () => {
            favorites = getStorageData("wondersci_favorites");
            const exists = favorites.some(item => String(item.id) === String(product.id));

            if (exists) {
                favorites = favorites.filter(item => String(item.id) !== String(product.id));
            } else {
                favorites.push(product);
            }

            localStorage.setItem("wondersci_favorites", JSON.stringify(favorites));
            renderProducts();
        });

        imageBox.append(favoriteButton);

        const category = document.createElement("div");
        category.className = "product-category";
        category.textContent = product.categoryName;

        const name = document.createElement("h3");
        name.className = "product-name";
        name.textContent = product.name;

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description;

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const price = document.createElement("span");
        price.className = "product-price";
        price.textContent = formatPrice(product.price);

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "add-to-cart";
        addButton.textContent = "🛒 Добави";

        addButton.addEventListener("click", () => {
            cart = getStorageData("wondersci_cart");
            const existingProduct = cart.find(item => String(item.id) === String(product.id));

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }
            localStorage.setItem("wondersci_cart", JSON.stringify(cart));
fetch("/api/outcomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName: "product_added_to_cart", metadata: product.name })
}).catch(() => {});

            addButton.textContent = "✓ Добавен";
            window.setTimeout(() => {
                addButton.textContent = "🛒 Добави";
            }, 1000);
        });

        bottom.append(price, addButton);
        card.append(imageBox, category, name, description, bottom);
        productsGrid.appendChild(card);
    });
}

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        categoryButtons.forEach(categoryButton => {
            categoryButton.classList.toggle(
                "active",
                categoryButton === button
            );
        });

        renderProducts();
    });
});

if (productSearch) {
    productSearch.addEventListener("input", renderProducts);
}

if (sortProducts) {
    sortProducts.addEventListener("change", renderProducts);
}

if (resetFilters) {
    resetFilters.addEventListener("click", () => {
        if (productSearch) productSearch.value = "";
        if (sortProducts) sortProducts.value = "default";
        selectedCategory = "all";

        categoryButtons.forEach(button => {
            button.classList.toggle("active", button.dataset.category === "all");
        });

        renderProducts();
    });
}

loadProductsFromMySQL();

function kolichka() {
    window.location.href = "kolichka.html";
}

function surce() {
    window.location.href = "lyubimi.html";
}
