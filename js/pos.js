
const products = [
  { id: "A001", name: "น้ำผสมฝาเงินขวดละ", prices: [80, 50, 60, 90], category: "น้ำ" },
  { id: "A002", name: "น้ำดิบขวดละ", prices: [40], category: "น้ำ" },
  { id: "A003", name: "น้ำดิบขวดเล็ก", prices: [25], category: "น้ำ" },
  { id: "A004", name: "น้ำผสมฝาเงินขวดเล็ก", prices: [50], category: "น้ำ" },
  { id: "A005", name: "น้ำผสมฝาแดงขวดเล็ก", prices: [60], category: "น้ำ" },
  { id: "A006", name: "น้ำผสมฝาแดงขวดละ", prices: [90], category: "น้ำ" },
  { id: "B001", name: "น้ำแข็ง", prices: [5, 10, 20], category: "อื่นๆ" },
  { id: "B002", name: "น้ำตาลสด", prices: [12], category: "อื่นๆ" },
  { id: "B003", name: "โค้ก", prices: [17], category: "อื่นๆ" },
  { id: "B004", name: "อิชิตัน", prices: [10], category: "อื่นๆ" },
  { id: "B005", name: "ใบขีดละ", prices: [15], category: "อื่นๆ" },
  { id: "B006", name: "ใบครึ่งโล", prices: [60], category: "อื่นๆ" },
  { id: "B007", name: "ใบกิโลละ", prices: [99], category: "อื่นๆ" },
  { id: "C001", name: "บุหรี่40ซองละ", prices: [40], category: "บุหรี่" },
  { id: "C002", name: "บุหรี่50ซองละ", prices: [50], category: "บุหรี่" },
  { id: "C003", name: "บุหรี่ซองละ", prices: [60], category: "บุหรี่" },
  { id: "D001", name: "ยาฝาเงินขวดละ", prices: [60], category: "ยา" },
  { id: "D002", name: "ยาฝาแดงขวดละ", prices: [70], category: "ยา" },
];

let cart = [];

function navigate(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
}

function filterCategory(cat) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  products.filter(p => p.category === cat).forEach(product => {
    const btn = document.createElement("button");
    btn.textContent = product.name;
    btn.onclick = () => selectPrice(product);
    container.appendChild(btn);
  });
}

function selectPrice(product) {
  if (product.prices.length === 1) {
    addToCart(product.name, product.prices[0]);
  } else {
    const choice = prompt("เลือกราคา: " + product.prices.join(", "));
    const price = parseInt(choice);
    if (product.prices.includes(price)) {
      addToCart(product.name, price);
    }
  }
}

function addToCart(name, price) {
  cart.push({ name, price });
  renderCart();
}

function renderCart() {
  const ul = document.getElementById("cart-items");
  const total = document.getElementById("cart-total");
  ul.innerHTML = "";
  let sum = 0;
  cart.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.name + " - " + item.price + " บาท";
    ul.appendChild(li);
    sum += item.price;
  });
  total.textContent = sum;
}

function checkout() {
  const method = prompt("เลือกช่องทางชำระ: เงินสด หรือ โอน");
  if (method === "เงินสด" || method === "โอน") {
    alert("รับชำระด้วย " + method + " รวม " + document.getElementById("cart-total").textContent + " บาท");
    cart = [];
    renderCart();
  } else {
    alert("กรุณากรอก เงินสด หรือ โอน เท่านั้น");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

function logout() {
  alert("ออกจากระบบแล้ว");
  window.location.href = "index.html";
}
