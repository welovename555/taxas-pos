document.addEventListener('DOMContentLoaded', () => {
    // ส่วนที่ 1: ตรวจสอบการล็อกอิน และ UI พื้นฐาน
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('current-user-name').textContent = currentUser.name;
    document.getElementById('logout-button').addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'index.html';
    });
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'flex');
    }

    // ส่วนที่ 2: ระบบ POS - ตัวแปรและข้อมูล
    let products = []; // <--- เปลี่ยนเป็นตัวแปรว่าง เพื่อรอรับข้อมูลจาก Supabase
    let liveStocks = {};
    let cart = [];

    // --- UI Element References ---
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
    const historyTableBody = document.getElementById('history-table-body');
    const loadingOverlay = document.getElementById('loading-overlay');
    const endShiftButton = document.getElementById('end-shift-button');
    const shiftSummaryModal = document.getElementById('shift-summary-modal');
    
    // ---- Render Functions ----
    function renderCategories() {
        const categories = [...new Set(products.map(p => p.category))];
        // เพื่อให้แน่ใจว่าหมวดหมู่เรียงตามที่คุณต้องการ อาจกำหนดลำดับเอง
        const sortedCategories = ['น้ำ', 'บุหรี่', 'ยา', 'อื่นๆ'].filter(c => categories.includes(c));
        
        categoryTabsContainer.innerHTML = '';
        sortedCategories.forEach((category, index) => {
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
            // สร้าง image path จาก id ของสินค้า
            const imagePath = `img/${p.id}.jpg`;
            const displayPrice = p.price ? `฿${p.price}` : 'เลือกราคา';

            item.innerHTML = `<img src="${imagePath}" alt="${p.name}" onerror="this.src='img/placeholder.png';"><div class="product-name">${p.name}</div><div class="product-price">${displayPrice}</div><div class="product-stock" style="color: ${isOutOfStock ? '#fa383e' : '#888'};">สต็อก: ${stock}</div>`;
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
                cartItemEl.innerHTML = `<span>${item.name} (${item.price}฿) x${item.quantity}</span><span>฿${item.price * item.quantity}</span>`;
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
        if (stock <= 0) { alert('สินค้าหมดสต็อก!'); return; }
        const cartItemId = `${productId}-${price}`;
        const existingItem = cart.find(item => item.cartId === cartItemId);
        if (existingItem) {
            if (existingItem.quantity < stock) { existingItem.quantity++; } else { alert('ไม่สามารถเพิ่มได้เนื่องจากสต็อกไม่เพียงพอ'); return; }
        } else {
            cart.push({ ...product, price: price, quantity: 1, cartId: cartItemId });
        }
        renderCart();
    }
    function openPriceModal(product) {
        document.getElementById('modal-product-name').textContent = `เลือกราคาสำหรับ: ${product.name}`;
        const optionsContainer = document.getElementById('modal-price-options');
        optionsContainer.innerHTML = '';
        // สมมติว่าข้อมูล prices อยู่ในคอลัมน์ jsonb หรือ text[] ใน supabase
        // ถ้าไม่มี ต้องไปดึงจากตาราง product_prices
        const pricesToDisplay = product.prices || []; // ใช้ prices ที่ดึงมา
        pricesToDisplay.forEach(price => {
            const button = document.createElement('button');
            button.className = 'price-option-button';
            button.textContent = `฿${price}`;
            button.onclick = () => { addToCart(product.id, price); closePriceModal(); };
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
        if (error) { console.error('โหลด stock ล้มเหลว:', error.message); return false; }
        data.forEach(item => { liveStocks[item.product_id] = item.stock; });
        return true;
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
        let shiftId = localStorage.getItem('currentShiftId');
        if (!shiftId) {
            try {
                const { data, error } = await supabaseClient.from('shifts').insert({ employee_id: currentUser.id }).select().single();
                if (error) throw error;
                shiftId = data.id;
                localStorage.setItem('currentShiftId', shiftId);
            } catch (error) { alert('เกิดข้อผิดพลาดในการเริ่มกะ: ' + error.message); return; }
        }
        const transactionId = crypto.randomUUID();
        try {
            const saleRecords = cart.map(item => ({ transaction_id: transactionId, shift_id: shiftId, employee_id: currentUser.id, product_id: item.id, price: item.price, qty: item.quantity, payment_type: 'cash' }));
            const { error } = await supabaseClient.from('sales').insert(saleRecords);
            if (error) throw error;
        } catch (error) { alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message); return; }
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
    async function fetchSalesHistory() {
        const today = new Date();
        if (today.getHours() < 6) { today.setDate(today.getDate() - 1); }
        today.setHours(6, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);
        const { data, error } = await supabaseClient.from('sales').select('*').gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()).order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching sales history:', error);
            alert('ไม่สามารถโหลดประวัติการขายได้: ' + error.message);
            return null;
        }
        const groupedSales = data.reduce((acc, sale) => {
            const txId = sale.transaction_id;
            if (!acc[txId]) {
                acc[txId] = { items: [], total: 0, payment_type: sale.payment_type, employee_id: sale.employee_id, created_at: sale.created_at };
            }
            acc[txId].items.push(sale);
            acc[txId].total += sale.price * sale.qty;
            return acc;
        }, {});
        return Object.values(groupedSales);
    }
    function renderSalesHistory(transactions) {
        historyTableBody.innerHTML = '';
        if (!transactions || transactions.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">ยังไม่มีรายการขายสำหรับวันนี้</td></tr>';
            return;
        }
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            const time = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const itemsString = tx.items.map(item => {
                const productInfo = products.find(p => p.id === item.product_id);
                const productName = productInfo ? productInfo.name : item.product_id;
                return `${productName} x${item.qty}`;
            }).join('\n');
            row.innerHTML = `<td>${time}</td><td class="items-cell">${itemsString}</td><td>฿${tx.total.toFixed(2)}</td><td>${tx.payment_type === 'cash' ? 'เงินสด' : 'โอนชำระ'}</td><td>${tx.employee_id}</td>`;
            historyTableBody.appendChild(row);
        });
    }
    async function displaySalesHistory() {
        loadingOverlay.style.display = 'flex';
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
        try {
            const fetchPromise = fetchSalesHistory();
            const [_, transactions] = await Promise.all([minLoadingTime, fetchPromise]);
            if (transactions) { renderSalesHistory(transactions); }
        } catch (error) {
            console.error("An error occurred in displaySalesHistory:", error);
            alert("เกิดข้อผิดพลาดในการแสดงผลประวัติการขาย");
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }
    async function endCurrentShift() {
        if (!confirm('คุณต้องการปิดกะและสรุปยอดขายใช่หรือไม่?')) return;
        const shiftId = localStorage.getItem('currentShiftId');
        if (!shiftId) {
            alert('ยังไม่มีการขายเกิดขึ้นในกะนี้ ไม่สามารถสรุปยอดได้');
            return;
        }
        loadingOverlay.style.display = 'flex';
        try {
            const { data: shiftStatus, error: statusError } = await supabaseClient.from('shifts').select('end_time').eq('id', shiftId).single();
            if (statusError) throw new Error('ไม่พบข้อมูลกะปัจจุบันในระบบ อาจถูกลบไปแล้ว');
            if (shiftStatus.end_time) {
                alert('กะนี้ได้ถูกปิดไปแล้ว');
                localStorage.removeItem('currentShiftId');
                loadingOverlay.style.display = 'none';
                return;
            }
            const { data: sales, error: salesError } = await supabaseClient.from('sales').select('*').eq('shift_id', shiftId);
            if (salesError) throw salesError;
            const summary = sales.reduce((acc, sale) => {
                const saleTotal = sale.price * sale.qty;
                acc.total += saleTotal;
                if (sale.payment_type === 'cash') { acc.cash += saleTotal; } 
                else if (sale.payment_type === 'transfer') { acc.transfer += saleTotal; }
                return acc;
            }, { total: 0, cash: 0, transfer: 0 });
            const { error: updateError } = await supabaseClient.from('shifts').update({ end_time: new Date().toISOString(), summary_totals: summary }).eq('id', shiftId);
            if (updateError) throw updateError;
            document.getElementById('shift-total-sales').textContent = `฿${summary.total.toFixed(2)}`;
            document.getElementById('shift-cash-sales').textContent = `฿${summary.cash.toFixed(2)}`;
            document.getElementById('shift-transfer-sales').textContent = `฿${summary.transfer.toFixed(2)}`;
            shiftSummaryModal.style.display = 'flex';
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการปิดกะ: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    async function fetchProducts() {
        const { data, error } = await supabaseClient.from('products').select('*');
        if (error) {
            console.error('Error fetching products:', error);
            alert('ไม่สามารถโหลดข้อมูลสินค้าได้');
            return false;
        }
        products = data;
        return true;
    }
    
    async function initializePOS() {
        loadingOverlay.style.display = 'flex';
        const productsLoaded = await fetchProducts();
        if (!productsLoaded) {
            loadingOverlay.style.display = 'none';
            return;
        }
        await fetchStockFromSupa();
        renderCategories();
        const initialCategory = document.querySelector('.category-tab.active')?.dataset.category;
        if (initialCategory) { renderProducts(initialCategory); }
        renderCart();
        loadingOverlay.style.display = 'none';
    }

    document.getElementById('sidebar-nav').addEventListener('click', e => {
        const navItem = e.target.closest('.nav-item');
        if (!navItem || navItem.classList.contains('active')) return;
        document.querySelectorAll('.nav-item').forEach(tab => tab.classList.remove('active'));
        navItem.classList.add('active');
        const tabName = navItem.dataset.tab;
        document.querySelectorAll('.content-view').forEach(view => view.style.display = 'none');
        const targetView = document.getElementById(tabName);
        if (targetView) targetView.style.display = 'flex';
        if (tabName === 'history-view') {
            displaySalesHistory();
        }
    });
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
        if (e.target.id === 'payment-modal-close-button' || e.target.id === 'payment-modal') { closePaymentModal(); return; }
        const button = e.target.closest('.payment-option-button');
        if (button) {
            const method = button.dataset.method;
            if (method === 'transfer') { processSale('transfer'); } 
            else if (method === 'cash') { closePaymentModal(); openChangeModal(); }
        }
    });
    moneyReceivedInput.addEventListener('input', () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const received = parseFloat(moneyReceivedInput.value) || 0;
        const change = received - total;
        changeDueAmountEl.textContent = `฿${change >= 0 ? change.toFixed(2) : '0.00'}`;
    });
    document.getElementById('confirm-payment-button').addEventListener('click', () => processSale('cash'));
    changeModal.addEventListener('click', e => { if (e.target.id === 'change-modal-close-button' || e.target.id === 'change-modal') closeChangeModal(); });
    endShiftButton.addEventListener('click', endCurrentShift);
    document.getElementById('shift-summary-close-button').addEventListener('click', () => {
        shiftSummaryModal.style.display = 'none';
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'index.html';
    });
    
    initializePOS();
});
