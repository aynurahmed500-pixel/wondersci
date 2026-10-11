
const favoritesList = document.getElementById("favoritesList");
const emptyFavorites = document.getElementById("emptyFavorites");
const favoritesCount = document.getElementById("favoritesCount");

// Примерни продукти за дизайна.
// По-късно ще ги свържем с каталога.
let favorites = [
    {
        id: 1,
        name: "Комплект „Малък химик“",
        description: "Открий интересни химични реакции и научни експерименти.",
        price: 12.90,
        image: "🧪"
    },
    {
        id: 2,
        name: "Комплект „Тайните на растенията“",
        description: "Изследвай растенията и наблюдавай как се развиват.",
        price: 9.90,
        image: "🌱"
    },
    {
        id: 3,
        name: "Кристален свят",
        description: "Запознай се с образуването и свойствата на кристалите.",
        price: 14.50,
        image: "💎"
    }
];

function formatPrice(price) {
    return price.toFixed(2).replace(".", ",") + " лв.";
}

function renderFavorites() {
    favoritesList.replaceChildren();

    const isEmpty = favorites.length === 0;

    emptyFavorites.hidden = !isEmpty;
    favoritesList.hidden = isEmpty;

    favoritesCount.textContent =
        favorites.length + (favorites.length === 1 ? " продукт" : " продукта");

    favorites.forEach(product => {
        const card = document.createElement("article");
        card.className = "favorite-card";

        const image = document.createElement("div");
        image.className = "product-image";
        image.textContent = product.image;
        image.setAttribute("aria-hidden", "true");

        const name = document.createElement("h3");
        name.className = "product-name";
        name.textContent = product.name;

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description;

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(product.price);

        const buttons = document.createElement("div");
        buttons.className = "card-buttons";

        const viewButton = document.createElement("button");
        viewButton.className = "view-button";
        viewButton.type = "button";
        viewButton.textContent = "Към продукта";

        viewButton.addEventListener("click", () => {
            // Засега води към каталога.
            window.location.href = "./katalog.html";
        });

        const removeButton = document.createElement("button");
        removeButton.className = "remove-button";
        removeButton.type = "button";
        removeButton.textContent = "♡ Премахни от любими";

        removeButton.addEventListener("click", () => {
            favorites = favorites.filter(item => item.id !== product.id);
            renderFavorites();
        });

        buttons.append(viewButton, removeButton);
        card.append(image, name, description, price, buttons);
        favoritesList.appendChild(card);
    });
}

renderFavorites();
