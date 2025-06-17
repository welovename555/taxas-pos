// js/pos.js (ฉบับรวมร่าง แก้ไขแล้ว)

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // ส่วนที่ 1: ตรวจสอบการล็อกอิน (จากโค้ดของ Gemini)
    // =================================================================
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        window.location.href = 'index.html';
        return;
    }

    console.log(`ยินดีต้อนรับ, ${currentUser.name}!`);
    console.log('Supabase client ที่พร้อมใช้งาน:', supabaseClient); // ใช้ตัวแปรที่ถูกต้อง

    const userNameElement = document.getElementById('current-user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // =================================================================
    // ส่วนที่ 2: ระบบ POS และสต็อก (จากโค้ดของคุณ)
    // =================================================================
    
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

    let liveStocks = {};

    async function fetchStockFromSupa() {
      // ใช้ supabaseClient ที่ถูกต้อง
      const { data, error } = await supabaseClient.from('product_stocks').select('*');
      if (error) {
        console.error('โหลด stock ล้มเหลว:', error.message);
        return;
      }
      data.forEach(item => {
        liveStocks[item.product_id] = item.stock;
      });
      renderStockToUI();
    }

    // ใช้ supabaseClient ที่ถูกต้อง
    supabaseClient
      .channel('stock-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_stocks' }, payload => {
        const updated = payload.new;
        if (updated) {
          console.log('Stock change received:', updated);
          liveStocks[updated.product_id] = updated.stock;
          renderStockToUI();
        }
      })
      .subscribe();

    function renderStockToUI() {
      // ฟังก์ชันนี้ต้องถูกเรียกใช้หลังจาก renderProducts แล้ว
      // เพื่อให้แน่ใจว่ามี element '.stock-amount' อยู่จริง
      document.querySelectorAll('.stock-amount').forEach(el => {
        const id = el.dataset.productId;
        el.textContent = liveStocks[id] ?? 'N/A';
      });
    }

    function renderProducts() {
      const container = document.getElementById('product-list'); // คุณต้องมี <div id="product-list"> ใน pos.html
      if (!container) return; // ป้องกัน error ถ้าไม่มี element นี้

      container.innerHTML = '';
      products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        // เราต้องทำให้ฟังก์ชัน sellProduct ถูกเรียกใช้ได้
        div.innerHTML = `
          <strong>${p.name}</strong><br/>
          <span>฿${p.price}</span><br/>
          <span class="stock-amount" data-product-id="${p.id}">-</span> ชิ้น<br/>
          <button data-product-id="${p.id}" class="sell-button">ขาย 1 ชิ้น</button>
        `;
        container.appendChild(div);
      });
    }
    
    // เมื่อมีการคลิกใน container ให้เช็คว่าเป็นปุ่มขายหรือไม่ (Event Delegation)
    document.getElementById('product-list')?.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('sell-button')) {
            const productId = event.target.dataset.productId;
            sellProduct(productId, 1);
        }
    });

    async function sellProduct(productId, qty = 1) {
      if (!liveStocks[productId] || liveStocks[productId] < qty) {
        alert("สต๊อกไม่เพียงพอ");
        return;
      }
      const newQty = liveStocks[productId] - qty;
      // ใช้ supabaseClient ที่ถูกต้อง
      const { error } = await supabaseClient.from('product_stocks').update({ stock: newQty }).eq('product_id', productId);
      if (error) {
        alert("อัปเดต stock ล้มเหลว: " + error.message);
      } else {
        console.log(`ขาย ${productId} สำเร็จ สต็อกใหม่คือ ${newQty}`);
      }
    }

    // ➤ เริ่มต้นระบบของหน้า POS
    // เราต้องแก้ไข pos.html ให้มี <div id="product-list"> ใน <section id="sell-view"> ด้วย
    // จากนั้นโค้ดส่วนนี้จะทำงานได้
    const sellView = document.getElementById('sell-view');
    if(sellView) {
        // เพิ่ม div สำหรับแสดงรายการสินค้าเข้าไป
        const productListDiv = document.createElement('div');
        productListDiv.id = 'product-list';
        sellView.appendChild(productListDiv);
        
        renderProducts();
        fetchStockFromSupa();
    }
});
