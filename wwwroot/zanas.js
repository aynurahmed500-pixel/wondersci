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
