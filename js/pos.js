// js/pos.js (ฉบับสมบูรณ์ - เพิ่มระบบ Checkout และคำนวณเงินทอน)

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
      { id: "D007", "name": "น้ำแข็ง", category: "อื่นๆ", prices: [5, 10, 20], image: "img/D007.jpg" },
    ];

    let liveStocks = {};
    let cart = [];

    // --- UI elements ---
    const categoryTabsContainer = document.getElementById('category-tabs');
    const productGridContainer = document.getElementById('product-grid');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');
    
    // --- Modal elements ---
    const priceModal = document.getElementById('multi-price-modal');
    const paymentModal = document.getElementById('payment-modal');
    const changeModal = document.getElementById('change-modal');
    const moneyReceivedInput = document.getElementById('money-received-input');
    const changeDueAmountEl = document.getElementById('change-due-amount');
    
    // ---- Render Functions ----
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

    function renderProducts(category) { /* ... โค้ดจากแชท 26 ... */ }
    function renderCart() { /* ... โค้ดจากแชท 26 ... */ }
    
    // ---- Data Handlers ----
    function addToCart(productId, price) { /* ... โค้ดจากแชท 26 ... */ }
    
    // ---- Modal Functions ----
    function openPriceModal(product) { /* ... โค้ดจากแชท 26 ... */ }
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

    // ---- Real-time & Data Fetching ----
    async function fetchStockFromSupa() { /* ... โค้ดจากแชท 26 ... */ }
    supabaseClient.channel('stock-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'product_stocks' }, (payload) => { /* ... โค้ดจากแชท 26 ... */ }).subscribe();

    // ---- ⭐️⭐️ CORE SALE PROCESS ⭐️⭐️ ----
    async function processSale(paymentMethod) {
        if (cart.length === 0) return;

        // ปิด Modal ทั้งหมด และแสดงสถานะกำลังทำงาน
        closePaymentModal();
        closeChangeModal();
        // อาจจะเพิ่ม UI loading spinner ที่นี่

        const total_price = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shiftId = sessionStorage.getItem('currentShiftId');

        // 1. จัดการเรื่องกะ (Shift)
        if (!shiftId) {
            try {
                const { data, error } = await supabaseClient.from('shifts').insert({ employee_id: currentUser.id, employee_name: currentUser.name }).select().single();
                if (error) throw error;
                shiftId = data.id;
                sessionStorage.setItem('currentShiftId', shiftId);
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการเริ่มกะ: ' + error.message); return;
            }
        }
        
        // 2. บันทึกข้อมูลการขาย
        try {
            const { error } = await supabaseClient.from('sales').insert({
                shift_id: shiftId,
                employee_id: currentUser.id,
                employee_name: currentUser.name,
                items: cart,
                total_price: total_price,
                payment_method: paymentMethod
            });
            if (error) throw error;
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message); return;
        }

        // 3. อัปเดตสต็อกสินค้า
        try {
            const stockUpdates = cart.map(item => {
                const newStock = (liveStocks[item.id] || 0) - item.quantity;
                return supabaseClient.from('product_stocks').update({ stock: newStock }).eq('product_id', item.id);
            });
            await Promise.all(stockUpdates);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการอัปเดตสต็อก: ' + error.message); return;
        }

        // 4. เสร็จสิ้น
        alert('บันทึกการขายสำเร็จ!');
        cart = [];
        renderCart();
    }

    // ---- Event Listeners ----
    categoryTabsContainer.addEventListener('click', (e) => { /* ... โค้ดจากแชท 26 ... */ });
    productGridContainer.addEventListener('click', (e) => { /* ... โค้ดจากแชท 26 ... */ });
    
    // Price Modal Listeners
    document.getElementById('multi-price-modal').addEventListener('click', e => { if (e.target.id === 'modal-close-button' || e.target.id === 'multi-price-modal') closePriceModal(); });

    // Payment Modal Listeners
    checkoutButton.addEventListener('click', () => { if (cart.length > 0) openPaymentModal(); });
    paymentModal.addEventListener('click', e => {
        const target = e.target;
        if (target.id === 'payment-modal-close-button' || target.id === 'payment-modal') {
            closePaymentModal();
            return;
        }
        const button = target.closest('.payment-option-button');
        if (button) {
            const method = button.dataset.method;
            if (method === 'Transfer') {
                processSale('Transfer');
            } else if (method === 'Cash') {
                closePaymentModal();
                openChangeModal();
            }
        }
    });

    // Change Modal Listeners
    moneyReceivedInput.addEventListener('input', () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const received = parseFloat(moneyReceivedInput.value) || 0;
        const change = received - total;
        changeDueAmountEl.textContent = `฿${change >= 0 ? change.toFixed(2) : '0.00'}`;
    });

    document.getElementById('confirm-payment-button').addEventListener('click', () => processSale('Cash'));
    changeModal.addEventListener('click', e => { if (e.target.id === 'change-modal-close-button' || e.target.id === 'change-modal') closeChangeModal(); });

    // ---- Initialize POS ----
    function initializePOS() { /* ... โค้ดจากแชท 26 ... */ }
    initializePOS();
});


// หมายเหตุ: เช่นเคยครับ ส่วนที่ผมย่อไว้ `/* ... โค้ดจากแชท 26 ... */` คุณต้องใช้โค้ดฉบับเต็มจากแชทที่ 26 นะครับเพื่อให้ทำงานได้ครบถ้วน
