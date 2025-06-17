// js/pos.js (ฉบับอัปเดต - เพิ่มหน้าประวัติการขาย)

document.addEventListener('DOMContentLoaded', () => {
    // --- ส่วนที่ 1: Authentication & Basic UI ---
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

    // --- ส่วนที่ 2: POS System Variables & Data ---
    const products = [ /* ... โค้ดรายการสินค้าทั้งหมด ... */ ];
    let liveStocks = {};
    let cart = [];

    // --- UI Element References ---
    const mainContent = document.getElementById('main-content');
    const categoryTabsContainer = document.getElementById('category-tabs');
    // ... (References อื่นๆ ทั้งหมด) ...
    const historyTableBody = document.getElementById('history-table-body');
    const loadingOverlay = document.getElementById('loading-overlay');

    // =================================================================
    // START: ฟังก์ชันทั้งหมดของระบบ
    // =================================================================

    // --- Render Functions ---
    function renderCategories() { /* ... โค้ดเดิม ... */ }
    function renderProducts(category) { /* ... โค้ดเดิม ... */ }
    function renderCart() { /* ... โค้ดเดิม ... */ }

    // --- Data Handlers ---
    function addToCart(productId, price) { /* ... โค้ดเดิม ... */ }

    // --- Modal Functions ---
    function openPriceModal(product) { /* ... โค้ดเดิม ... */ }
    // ... (Modal functions อื่นๆ ทั้งหมด) ...

    // --- Real-time & Data Fetching ---
    async function fetchStockFromSupa() { /* ... โค้ดเดิม ... */ }
    supabaseClient.channel('stock-changes').on('postgres_changes', { /* ... */ }).subscribe();

    // --- Core Sale Process ---
    async function processSale(paymentMethod) { /* ... โค้ดเดิม ... */ }

    // --- ⭐️⭐️ ฟังก์ชันใหม่สำหรับหน้าประวัติ ⭐️⭐️ ---
    
    async function fetchSalesHistory() {
        const today = new Date();
        today.setHours(6, 0, 0, 0); // ตั้งเวลาเป็น 06:00:00 ของวันนี้

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // ตั้งเวลาเป็น 02:00:00 ของวันพรุ่งนี้

        const { data, error } = await supabaseClient
            .from('sales')
            .select('*')
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sales history:', error);
            alert('ไม่สามารถโหลดประวัติการขายได้');
            return null;
        }

        // จัดกลุ่มข้อมูลตาม transaction_id
        const groupedSales = data.reduce((acc, sale) => {
            if (!acc[sale.transaction_id]) {
                acc[sale.transaction_id] = {
                    items: [],
                    total: 0,
                    payment_type: sale.payment_type,
                    employee_name: sale.employee_name,
                    created_at: sale.created_at
                };
            }
            acc[sale.transaction_id].items.push(sale);
            acc[sale.transaction_id].total += sale.price * sale.qty;
            return acc;
        }, {});

        return Object.values(groupedSales); // คืนค่าเป็น Array ของบิล
    }

    function renderSalesHistory(transactions) {
        historyTableBody.innerHTML = ''; // ล้างข้อมูลเก่า
        if (!transactions || transactions.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">ยังไม่มีรายการขายสำหรับวันนี้</td></tr>';
            return;
        }

        transactions.forEach(tx => {
            const row = document.createElement('tr');
            
            const time = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            const itemsString = tx.items.map(item => {
                // ค้นหาชื่อสินค้าจาก local products array
                const productInfo = products.find(p => p.id === item.product_id);
                const productName = productInfo ? productInfo.name : item.product_id;
                return `${productName} (${item.price}฿) x${item.qty}`;
            }).join('\n'); // ใช้ \n เพื่อให้ CSS จัดการขึ้นบรรทัดใหม่

            row.innerHTML = `
                <td>${time}</td>
                <td class="items-cell">${itemsString}</td>
                <td>฿${tx.total.toFixed(2)}</td>
                <td>${tx.payment_type === 'cash' ? 'เงินสด' : 'โอนชำระ'}</td>
                <td>${tx.employee_name || 'N/A'}</td>
            `;
            historyTableBody.appendChild(row);
        });
    }

    async function displaySalesHistory() {
        loadingOverlay.style.display = 'flex';
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000)); // รออย่างน้อย 1 วินาที
        
        const fetchPromise = fetchSalesHistory();

        const [_, transactions] = await Promise.all([minLoadingTime, fetchPromise]);

        if (transactions) {
            renderSalesHistory(transactions);
        }
        
        loadingOverlay.style.display = 'none';
    }


    // =================================================================
    // START: Event Listeners & Initialization
    // =================================================================

    document.getElementById('sidebar-nav').addEventListener('click', e => {
        const navItem = e.target.closest('.nav-item');
        if (!navItem) return;

        // จัดการ active class
        document.querySelectorAll('.nav-item').forEach(tab => tab.classList.remove('active'));
        navItem.classList.add('active');

        // ซ่อน view ทั้งหมด
        document.querySelectorAll('.content-view').forEach(view => view.style.display = 'none');
        
        const tabName = navItem.dataset.tab;
        const targetView = document.getElementById(tabName);

        if (targetView) {
            targetView.style.display = 'flex'; // ใช้ flex เพราะเราตั้ง layout หลักไว้
            if (tabName === 'history-view') {
                displaySalesHistory(); // เรียกฟังก์ชันโหลดประวัติเมื่อกด tab
            }
        }
    });

    // ... (Event Listeners อื่นๆ ทั้งหมด) ...
    // ... (InitializePOS function) ...
    
    // -- คัดลอกเนื้อหาฟังก์ชันและ Listener ทั้งหมดจากไฟล์ล่าสุด (แชท 52) มาใส่ในส่วนนี้ให้ครบถ้วน --
});
