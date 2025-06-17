// pos.js - TEXAS POS ระบบขาย พร้อมเชื่อม Supabase เฉพาะ stock แบบ real-time

// ➤ เชื่อมต่อ Supabase
const supabaseUrl = 'https://nmlcduawkcaaglcdlhgv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbGNkdWF3a2NhYWdsY2RsaGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM3MDUsImV4cCI6MjA2NTUwOTcwNX0.1NnKZ0begtYSPF7mjDip0lYoR7w1_4qHu5aeDWLWVJY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ➤ สินค้าแบบ local (ใช้แสดงเท่านั้น)
const products = [
  { id: "A001", name: "น้ำดิบขวดใหญ่", price: 40 },
  { id: "A002", name: "น้ำดิบขวดเล็ก", price: 25 },
  { id: "A003", name: "น้ำผสมฝาเงินขวดเล็ก", price: 50 },
  { id: "A004", name: "น้ำผสมฝาเงินขวดใหญ่", price: 80 },
  { id: "A005", name: "น้ำผสมฝาแดงขวดเล็ก", price: 60 },
  { id: "A006", name: "น้ำผสมฝาแดงขวดใหญ่", price: 90 },
  { id: "B001", name: "บุหรี่ 40", price: 40 },
  { id: "B002", name: "บุหรี่ 50", price: 50 },
  { id: "B003", name: "บุหรี่ 60", price: 60 },
  { id: "C001", name: "ยาฝาเงิน", price: 60 },
  { id: "C002", name: "ยาฝาแดง", price: 70 },
  { id: "D001", name: "น้ำตาลสด", price: 12 },
  { id: "D002", name: "โค้ก", price: 17 },
  { id: "D003", name: "อิชิตัน", price: 10 },
  { id: "D004", name: "ใบขีด", price: 15 },
  { id: "D005", name: "ใบครึ่งโล", price: 60 },
  { id: "D006", name: "ใบกิโล", price: 99 },
  { id: "D007", name: "น้ำแข็ง", price: 5 },
];

// ➤ stock ปัจจุบันจาก Supabase
let liveStocks = {};

// ➤ โหลด stock เริ่มต้น
async function fetchStockFromSupa() {
  const { data, error } = await supabase.from('product_stocks').select('*');
  if (error) {
    console.error('โหลด stock ล้มเหลว:', error.message);
    return;
  }
  data.forEach(item => {
    liveStocks[item.product_id] = item.stock;
  });
  renderStockToUI();
}

// ➤ subscribe การเปลี่ยนแปลง stock แบบ real-time
supabase
  .channel('stock-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'product_stocks' }, payload => {
    const updated = payload.new;
    if (updated) {
      liveStocks[updated.product_id] = updated.stock;
      renderStockToUI();
    }
  })
  .subscribe();

// ➤ อัปเดต UI เมื่อ stock เปลี่ยน
function renderStockToUI() {
  document.querySelectorAll('.stock-amount').forEach(el => {
    const id = el.dataset.productId;
    el.textContent = liveStocks[id] ?? '-';
  });
}

// ➤ render รายการสินค้าในหน้าเว็บ
function renderProducts() {
  const container = document.getElementById('product-list');
  container.innerHTML = '';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <strong>${p.name}</strong><br/>
      <span>฿${p.price}</span><br/>
      <span class="stock-amount" data-product-id="${p.id}">-</span> ชิ้น<br/>
      <button onclick="sellProduct('${p.id}', 1)">ขาย 1 ชิ้น</button>
    `;
    container.appendChild(div);
  });
}

// ➤ เมื่อขายสินค้า
async function sellProduct(productId, qty = 1) {
  if (!liveStocks[productId] || liveStocks[productId] < qty) {
    alert("สต๊อกไม่เพียงพอ");
    return;
  }
  const newQty = liveStocks[productId] - qty;
  const { error } = await supabase.from('product_stocks').update({ stock: newQty }).eq('product_id', productId);
  if (error) {
    alert("อัปเดต stock ล้มเหลว");
  }
}

// ➤ เริ่มต้นระบบ
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  fetchStockFromSupa();
});
