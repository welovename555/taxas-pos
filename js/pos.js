// js/pos.js (ฉบับอัปเดต - เพิ่มระบบหลายราคา)

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

    document.getElementById('current-user-name').textContent = currentUser.name;
    document.getElementById('logout-button').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    // =================================================================
    // ส่วนที่ 2: ระบบ POS
    // =================================================================
    
    const products = [
      // **แก้ไข** เพิ่ม property `prices` สำหรับสินค้าหลายราคา
      { id: "A001", name: "น้ำดิบขวดใหญ่", category: "น้ำ", price: 40, image: "img/A001.jpg" },
      { id: "A002", name: "น้ำดิบขวดเล็ก", category: "น้ำ", price: 25, image: "img/A002.jpg" },
      { id: "A003", name: "น้ำผสมฝาเงินขวดเล็ก", category: "น้ำ", price: 50, image: "img/A003.jpg" },
      { id: "A004", name: "น้ำผสมฝาเงินขวดใหญ่", category: "น้ำ", prices: [80, 50, 60, 90], image: "img/A004.jpg" }, 
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
      { id: "D007", "name": "น้ำแข็ง", category: "อื่นๆ", prices: [5, 10, 20], image: "img/D007.jpg" }, // **แก้ไข** ย้ายหมวดหมู่และใช้ `prices`
    ];

    let liveStocks = {};
    let cart = [];

    // --- ตัวแปรสำหรับ UI elements ---
    const categoryTabsContainer = document.getElementById('category-tabs');
    const productGridContainer = document.getElementById('product-grid');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');
    
    // --- ตัวแปรสำหรับ Modal ---
    const modal = document.getElementById('multi-price-modal');
    const modalProductName = document.getElementById('modal-product-name');
    const modalPriceOptions = document.getElementById('modal-price-options');
    const modalCloseButton = document.getElementById('modal-close-button');


    // ---- ฟังก์ชันสำหรับแสดงผล (Render Functions) ----

    function renderCategories() {
        const categories = ['น้ำ', 'บุหรี่', 'ยา', 'อื่นๆ']; // เรียงตามที่ต้องการ
        categoryTabsContainer.innerHTML = '';
        categories.forEach((category, index) => {
            const tab = document.createElement('div');
            tab.className = 'category-tab';
            tab.textContent = category;
            tab.dataset.category = category;
            if (index === 0) tab.classList.add('active');
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
            const displayPrice = p.price ? `฿${p.price}` : 'เลือกราคา';

            item.innerHTML = `
                <img src="${p.image}" alt="${p.name}" onerror="this.src='img/placeholder.png';">
                <div class="product-name">${p.name}</div>
                <div class="product-price">${displayPrice}</div>
                <div class="product-stock" style="color: ${isOutOfStock ? '#fa383e' : '#888'};">สต็อก: ${stock}</div>
            `;
            if (isOutOfStock) item.classList.add('disabled');
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
                    <span>${item.name} (${item.price}฿) x${item.quantity}</span>
                    <span>฿${item.price * item.quantity}</span>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });
            checkoutButton.disabled = false;
        }
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPriceEl.textContent = `฿${totalPrice}`;
    }
    
    // ---- ฟังก์ชันสำหรับจัดการข้อมูล (Data Handlers) ----

    function addToCart(productId, price) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const stock = liveStocks[productId] ?? 0;
        if (stock <= 0) {
            alert('สินค้าหมดสต็อก!');
            return;
        }

        const cartItemId = `${productId}-${price}`; // สร้าง ID เฉพาะสำหรับสินค้าที่มีราคาต่างกัน
        const existingItem = cart.find(item => item.cartId === cartItemId);
        
        if (existingItem) {
            if(existingItem.quantity < stock) {
                existingItem.quantity++;
            } else {
                alert('ไม่สามารถเพิ่มได้เนื่องจากสต็อกไม่เพียงพอ');
                return;
            }
        } else {
            cart.push({ ...product, price: price, quantity: 1, cartId: cartItemId });
        }
        renderCart();
    }
    
    // --- ฟังก์ชันสำหรับ Modal ---
    function openPriceModal(product) {
        modalProductName.textContent = `เลือกราคาสำหรับ: ${product.name}`;
        modalPriceOptions.innerHTML = '';
        product.prices.forEach(price => {
            const button = document.createElement('button');
            button.className = 'price-option-button';
            button.textContent = `฿${price}`;
            button.onclick = () => {
                addToCart(product.id, price);
                closePriceModal();
            };
            modalPriceOptions.appendChild(button);
        });
        modal.style.display = 'flex';
    }

    function closePriceModal() {
        modal.style.display = 'none';
    }

    // ---- การดึงข้อมูลและ Real-time ----
    async function fetchStockFromSupa() {
      const { data, error } = await supabaseClient.from('product_stocks').select('*');
      if (error) { console.error('โหลด stock ล้มเหลว:', error.message); return; }
      data.forEach(item => { liveStocks[item.product_id] = item.stock; });
      const currentCategory = document.querySelector('.category-tab.active')?.dataset.category;
      if (currentCategory) renderProducts(currentCategory);
    }

    supabaseClient.channel('stock-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'product_stocks' }, payload => {
        const updated = payload.new;
        if (updated) {
          liveStocks[updated.product_id] = updated.stock;
          const currentCategory = document.querySelector('.category-tab.active')?.dataset.category;
          if (currentCategory) renderProducts(currentCategory);
        }
      }).subscribe();

    // ---- Event Listeners ----
    categoryTabsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('category-tab')) {
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            renderProducts(e.target.dataset.category);
        }
    });

    productGridContainer.addEventListener('click', e => {
        const productItem = e.target.closest('.product-item');
        if (productItem && !productItem.classList.contains('disabled')) {
            const productId = productItem.dataset.productId;
            const product = products.find(p => p.id === productId);

            if (product.prices) { // ถ้ามี property `prices` ให้เปิด Modal
                openPriceModal(product);
            } else { // ถ้าไม่มี ให้เพิ่มลงตะกร้าเลย
                addToCart(productId, product.price);
            }
        }
    });

    modalCloseButton.addEventListener('click', closePriceModal);
    modal.addEventListener('click', e => {
        if (e.target === modal) closePriceModal(); // ปิด Modal เมื่อคลิกที่พื้นหลังสีดำ
    });

    // ---- เริ่มต้นการทำงานของหน้า POS ----
    function initializePOS() {
        renderCategories();
        const initialCategory = document.querySelector('.category-tab.active')?.dataset.category;
        if (initialCategory) renderProducts(initialCategory);
        renderCart();
        fetchStockFromSupa();
    }

    initializePOS();
});
