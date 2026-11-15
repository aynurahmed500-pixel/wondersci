function toggleMenu() {
  var menu = document.getElementById("menu");
  menu.classList.toggle("active");
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

// Тук ще се заредят истинските продукти от MySQL
let products = [];

const categoryNames = {
    chemistry: "Химия",
    nature: "Природа",
    crystals: "Кристали",
    physics: "Физика"
};

let selectedCategory = "all";
let favorites = [];
let cart = [];

// Взимаме продуктите от C# сървъра (/products)
async function loadProductsFromMySQL() {
    try {
        const response = await fetch("/products");
        const data = await response.json();

        products = data.map(p => {
            const catKey = (p.category || "").toLowerCase();
            return {
                id: p.id,
                name: p.name,
                category: catKey,
                categoryName: categoryNames[catKey] || p.category || "Наука",
                description: p.description || "",
                price: Number(p.price),
                image: p.image || "🧪"
            };
        });

        renderProducts();
    } catch (error) {
        console.error("Грешка при връзка с MySQL:", error);
    }
}

function formatPrice(price) {
    return price.toFixed(2).replace(".", ",") + " лв.";
}

function getVisibleProducts() {
    const searchTerm = productSearch.value.trim().toLowerCase();

    let visibleProducts = products.filter(product => {
        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const searchableText =
            `${product.name} ${product.description} ${product.categoryName}`.toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });

    const sortValue = sortProducts.value;

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
    productsGrid.replaceChildren();

    const visibleProducts = getVisibleProducts();

    productsCount.textContent =
        visibleProducts.length +
        (visibleProducts.length === 1 ? " продукт" : " продукта");

    noProducts.hidden = visibleProducts.length !== 0;
    productsGrid.hidden = visibleProducts.length === 0;

    visibleProducts.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageBox = document.createElement("div");
        imageBox.className = "product-image";

        // Ако в базата има линк към снимка (http...), показва снимка, иначе емоджи
        if (product.image.startsWith("http") || product.image.includes(".")) {
            const img = document.createElement("img");
            img.src = product.image;
            img.alt = product.name;
            imageBox.append(img);
        } else {
            const image = document.createElement("span");
            image.textContent = product.image;
            image.setAttribute("aria-hidden", "true");
            imageBox.append(image);
        }

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className = "favorite-button";

        const isFavorite = favorites.includes(product.id);

        favoriteButton.classList.toggle("is-favorite", isFavorite);
        favoriteButton.textContent = isFavorite ? "♥" : "♡";
        favoriteButton.setAttribute(
            "aria-label",
            isFavorite ? "Премахни от любими" : "Добави в любими"
        );

        favoriteButton.addEventListener("click", () => {
            if (favorites.includes(product.id)) {
                favorites = favorites.filter(id => id !== product.id);
            } else {
                favorites.push(product.id);
            }

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
            const existingProduct = cart.find(item => item.id === product.id);

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                });
            }

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

productSearch.addEventListener("input", renderProducts);
sortProducts.addEventListener("change", renderProducts);

resetFilters.addEventListener("click", () => {
    productSearch.value = "";
    sortProducts.value = "default";
    selectedCategory = "all";

    categoryButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.category === "all");
    });

    renderProducts();
});

// Зареждаме данните от базата при отваряне на страницата
loadProductsFromMySQL();
