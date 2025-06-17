// js/pos.js (ฉบับอัปเดต - เพิ่มระบบตะกร้าและแสดงผลสินค้า)

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // ส่วนที่ 1: ตรวจสอบการล็อกอิน และ UI พื้นฐาน
    // =================================================================
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        window.location.href = 'index.html';
        return;
    }

    console.log(`ยินดีต้อนรับ, ${currentUser.name}!`);
    document.getElementById('current-user-name').textContent = currentUser.name;

    document.getElementById('logout-button').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // แสดงเมนูสำหรับ Admin
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    // =================================================================
    // ส่วนที่ 2: ระบบ POS
    // =================================================================
    
    const products = [
      { id: "A001", name: "น้ำดิบขวดใหญ่", category: "น้ำ", price: 40, image: "img/A001.jpg" },
      { id: "A002", name: "น้ำดิบขวดเล็ก", category: "น้ำ", price: 25, image: "img/A002.jpg" },
      { id: "A003", name: "น้ำผสมฝาเงินขวดเล็ก", category: "น้ำ", price: 50, image: "img/A003.jpg" },
      { id: "A004", name: "น้ำผสมฝาเงินขวดใหญ่", category: "น้ำ", price: 80, image: "img/A004.jpg" }, // มีหลายราคา
      { id: "A005", name: "น้ำผสมฝาแดงขวดเล็ก", category: "น้ำ", price: 60, image: "img/A005.jpg" },
      { id: "A006", name: "น้ำผสมฝาแดงขวดใหญ่", category: "น้ำ", price: 90, image: "img/A006.jpg" },
      { id: "B001", name: "บุหรี่ 40", category: "บุหรี่", price: 40, image: "img/B001.jpg" },
      { id: "B002", name: "บุหรี่ 50", category: "บุหรี่", price: 50, image: "img/B002.jpg" },
      { id: "B003", name: "บุหรี่ 60", category: "บุหรี่", price: 60, image: "img/B003.jpg" },
      { id: "C001", name: "ยาฝาเงิน", category: "ยา", price: 60, image: "img/C001.jpg" },
      { id: "C002", name: "ยาฝาแดง", category: "ยา", price: 70, image: "img/C002.jpg" },
      { id: "D001", name: "น้ำตาลสด", category: "อื่นๆ", price: 12, image: "img/D001.jpg" },
      { id: "D002", name: "โค้ก", category: "อื่นๆ", price: 17, image: "img/D002.jpg" },
      { id: "D003", "name": "อิชิตัน", category: "อื่นๆ", price: 10, image: "img/D003.jpg" },
      { id: "D004", "name": "ใบขีด", category: "อื่นๆ", price: 15, image: "img/D004.jpg" },
      { id: "D005", "name": "ใบครึ่งโล", category: "อื่นๆ", price: 60, image: "img/D005.jpg" },
      { id: "D006", "name": "ใบกิโล", category: "อื่นๆ", price: 99, image: "img/D006.jpg" },
      { id: "D007", "name": "น้ำแข็ง", category: "น้ำ", price: 5, image: "img/D007.jpg" }, // มีหลายราคา
    ];

    let liveStocks = {};
    let cart = []; // <-- ตัวแปรสำหรับเก็บตะกร้าสินค้า

    const categoryTabsContainer = document.getElementById('category-tabs');
    const productGridContainer = document.getElementById('product-grid');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');
    
    // ---- ฟังก์ชันสำหรับแสดงผล ----

    function renderCategories() {
        const categories = [...new Set(products.map(p => p.category))];
        categoryTabsContainer.innerHTML = '';
        categories.forEach((category, index) => {
            const tab = document.createElement('div');
            tab.className = 'category-tab';
            tab.textContent = category;
            tab.dataset.category = category;
            if (index === 0) {
                tab.classList.add('active'); // ตั้งให้หมวดหมู่แรกถูกเลือกอยู่
            }
            categoryTabsContainer.appendChild(tab);
        });
    }

    function renderProducts(category) {
        const productsToRender = products.filter(p => p.category === category);
        productGridContainer.innerHTML = '';
        productsToRender.forEach(p => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.dataset.productId = p.id;
            
            const stock = liveStocks[p.id] ?? 'N/A';
            const isOutOfStock = stock === 'N/A' || stock <= 0;

            item.innerHTML = `
                <img src="${p.image}" alt="${p.name}" onerror="this.src='img/placeholder.png';">
                <div class="product-name">${p.name}</div>
                <div class="product-price">฿${p.price}</div>
                <div class="product-stock" style="color: ${isOutOfStock ? '#fa383e' : '#888'};">
                    สต็อก: ${stock}
                </div>
            `;
            if (isOutOfStock) {
                item.classList.add('disabled'); // ทำให้จางถ้าของหมด
            }
            productGridContainer.appendChild(item);
        });
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-cart-text">ตะกร้าสินค้าว่าง</p>`;
            checkoutButton.disabled = true;
        } else {
            cartItemsContainer.innerHTML = '';
            cart.forEach(item => {
                const cartItemEl = document.createElement('div');
                cartItemEl.className = 'cart-item';
                cartItemEl.innerHTML = `
                    <span>${item.name} x${item.quantity}</span>
                    <span>฿${item.price * item.quantity}</span>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });
            checkoutButton.disabled = false;
        }

        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPriceEl.textContent = `฿${totalPrice}`;
    }

    // ---- ฟังก์ชันสำหรับจัดการข้อมูล ----

    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // ตรวจสอบสต็อก
        const stock = liveStocks[productId] ?? 0;
        if (stock <= 0) {
            alert('สินค้าหมดสต็อก!');
            return;
        }
        
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            // เช็คว่าเพิ่มแล้วเกินสต็อกหรือไม่
            if(existingItem.quantity < stock) {
                existingItem.quantity++;
            } else {
                alert('ไม่สามารถเพิ่มได้เนื่องจากสต็อกไม่เพียงพอ');
                return;
            }
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        renderCart();
    }
    
    // ---- การดึงข้อมูลและ Real-time ----

    async function fetchStockFromSupa() {
      const { data, error } = await supabaseClient.from('product_stocks').select('*');
      if (error) {
        console.error('โหลด stock ล้มเหลว:', error.message);
        return;
      }
      data.forEach(item => {
        liveStocks[item.product_id] = item.stock;
      });
      // เมื่อโหลด stock เสร็จ ให้ re-render สินค้าเพื่ออัปเดตสถานะ
      const currentCategory = document.querySelector('.category-tab.active')?.dataset.category;
      if (currentCategory) {
          renderProducts(currentCategory);
      }
    }

    supabaseClient
      .channel('stock-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_stocks' }, payload => {
        const updated = payload.new;
        if (updated) {
          liveStocks[updated.product_id] = updated.stock;
          const currentCategory = document.querySelector('.category-tab.active')?.dataset.category;
          if (currentCategory) {
              renderProducts(currentCategory); // อัปเดต UI ทันที
          }
        }
      })
      .subscribe();

    // ---- Event Listeners ----
    
    categoryTabsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('category-tab')) {
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            renderProducts(event.target.dataset.category);
        }
    });

    productGridContainer.addEventListener('click', (event) => {
        const productItem = event.target.closest('.product-item');
        if (productItem && !productItem.classList.contains('disabled')) {
            addToCart(productItem.dataset.productId);
        }
    });

    // ---- เริ่มต้นการทำงานของหน้า POS ----
    function initializePOS() {
        renderCategories();
        // แสดงสินค้าในหมวดหมู่แรกที่ active อยู่
        const initialCategory = document.querySelector('.category-tab.active')?.dataset.category;
        if (initialCategory) {
            renderProducts(initialCategory);
        }
        renderCart();
        fetchStockFromSupa();
    }

    initializePOS();
});
