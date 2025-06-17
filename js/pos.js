// js/pos.js (ฉบับสมบูรณ์ - แก้ไขค่า payment_type ให้ตรงกับ DB)

document.addEventListener('DOMContentLoaded', () => {
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

    const products = [
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
      { id: "D003", name: "อิชิตัน", category: "อื่นๆ", price: 10, image: "img/D003.jpg" },
      { id: "D004", name: "ใบขีด", category: "อื่นๆ", price: 15, image: "img/D004.jpg" },
      { id: "D005", name: "ใบครึ่งโล", category: "อื่นๆ", price: 60, image: "img/D005.jpg" },
      { id: "D006", name: "ใบกิโล", category: "อื่นๆ", price: 99, image: "img/D006.jpg" },
      { id: "D007", name: "น้ำแข็ง", category: "อื่นๆ", prices: [5, 10, 20], image: "img/D007.jpg" },
    ];
    let liveStocks = {};
    let cart = [];
    const categoryTabsContainer = document.getElementById('category-tabs');
    const productGridContainer = document.getElementById('product-grid');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');
    const priceModal = document.getElementById('multi-price-modal');
    const paymentModal = document.getElementById('payment-modal');
    const changeModal = document.getElementById('change-modal');
    const moneyReceivedInput = document.getElementById('money-received-input');
    const changeDueAmountEl = document.getElementById('change-due-amount');
    function renderCategories() {
        const categories = ['น้ำ', 'บุหรี่', 'ยา', 'อื่นๆ'];
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
    function addToCart(productId, price) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const stock = liveStocks[productId] ?? 0;
        if (stock <= 0) {
            alert('สินค้าหมดสต็อก!');
            return;
        }
        const cartItemId = `${productId}-${price}`;
        const existingItem = cart.find(item => item.cartId === cartItemId);
        if (existingItem) {
            if (existingItem.quantity < stock) {
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
    function openPriceModal(product) {
        document.getElementById('modal-product-name').textContent = `เลือกราคาสำหรับ: ${product.name}`;
        const optionsContainer = document.getElementById('modal-price-options');
        optionsContainer.innerHTML = '';
        product.prices.forEach(price => {
            const button = document.createElement('button');
            button.className = 'price-option-button';
            button.textContent = `฿${price}`;
            button.onclick = () => {
                addToCart(product.id, price);
                closePriceModal();
            };
            optionsContainer.appendChild(button);
        });
        priceModal.style.display = 'flex';
    }
    function closePriceModal() { priceModal.style.display = 'none'; }
    function openPaymentModal() { paymentModal.style.display = 'flex'; }
    function closePaymentModal() { paymentModal.style.display = 'none'; }
    function openChangeModal() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('change-modal-total').textContent = `฿${total}`;
        moneyReceivedInput.value = '';
        changeDueAmountEl.textContent = `฿0`;
        changeModal.style.display = 'flex';
        moneyReceivedInput.focus();
    }
    function closeChangeModal() { changeModal.style.display = 'none'; }
    async function fetchStockFromSupa() {
        const { data, error } = await supabaseClient.from('product_stocks').select('*');
        if (error) { console.error('โหลด stock ล้มเหลว:', error.message); return; }
        data.forEach(item => { liveStocks[item.product_id] = item.stock; });
        const currentCategory = document.querySelector('.category-tab.active')?.dataset.category;
        if (currentCategory) renderProducts(currentCategory);
    }
    supabaseClient.channel('stock-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'product_stocks' }, (payload) => {
        const updated = payload.new;
        if (updated) {
            liveStocks[updated.product_id] = updated.stock;
            const currentCategory = document.querySelector('.category-tab.active')?.dataset.category;
            if (currentCategory) renderProducts(currentCategory);
        }
    }).subscribe();
    async function processSale(paymentMethod) {
        if (cart.length === 0) return;
        closePaymentModal();
        closeChangeModal();
        let shiftId = sessionStorage.getItem('currentShiftId');
        if (!shiftId) {
            try {
                const { data, error } = await supabaseClient.from('shifts').insert({ employee_id: currentUser.id }).select().single();
                if (error) throw error;
                shiftId = data.id;
                sessionStorage.setItem('currentShiftId', shiftId);
            } catch (error) { alert('เกิดข้อผิดพลาดในการเริ่มกะ: ' + error.message); return; }
        }
        try {
            const saleRecords = cart.map(item => ({
                shift_id: shiftId,
                employee_id: currentUser.id,
                product_id: item.id,
                price: item.price,
                qty: item.quantity,
                payment_type: paymentMethod
            }));
            const { error } = await supabaseClient.from('sales').insert(saleRecords);
            if (error) throw error;
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message);
            return;
        }
        try {
            const stockUpdates = cart.map(item => {
                const newStock = (liveStocks[item.id] || 0) - item.quantity;
                return supabaseClient.from('product_stocks').update({ stock: newStock }).eq('product_id', item.id);
            });
            await Promise.all(stockUpdates);
        } catch (error) { alert('เกิดข้อผิดพลาดในการอัปเดตสต็อก: ' + error.message); return; }
        alert('บันทึกการขายสำเร็จ!');
        cart = [];
        renderCart();
    }
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
            if (product.prices) { openPriceModal(product); } 
            else { addToCart(productId, product.price); }
        }
    });
    priceModal.addEventListener('click', e => { if (e.target.id === 'modal-close-button' || e.target.id === 'multi-price-modal') closePriceModal(); });
    checkoutButton.addEventListener('click', () => { if (cart.length > 0) openPaymentModal(); });
    paymentModal.addEventListener('click', e => {
        if (e.target.id === 'payment-modal-close-button' || e.target.id === 'payment-modal') {
            closePaymentModal();
            return;
        }
        const button = e.target.closest('.payment-option-button');
        if (button) {
            const method = button.dataset.method;
            // V V V V V ส่วนที่แก้ไข V V V V V
            if (method === 'transfer') {
                processSale('transfer');
            } else if (method === 'cash') {
                closePaymentModal();
                openChangeModal();
            }
            // ^ ^ ^ ^ ^ ส่วนที่แก้ไข ^ ^ ^ ^ ^
        }
    });
    moneyReceivedInput.addEventListener('input', () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const received = parseFloat(moneyReceivedInput.value) || 0;
        const change = received - total;
        changeDueAmountEl.textContent = `฿${change >= 0 ? change.toFixed(2) : '0.00'}`;
    });
    document.getElementById('confirm-payment-button').addEventListener('click', () => processSale('cash')); // V V V แก้ไขตรงนี้ด้วย
    changeModal.addEventListener('click', e => { if (e.target.id === 'change-modal-close-button' || e.target.id === 'change-modal') closeChangeModal(); });

    function initializePOS() {
        renderCategories();
        const initialCategory = document.querySelector('.category-tab.active')?.dataset.category;
        if (initialCategory) { renderProducts(initialCategory); }
        renderCart();
        fetchStockFromSupa();
    }
    initializePOS();
});
