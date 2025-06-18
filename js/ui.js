// ui.js - All functions for rendering UI elements

export function renderCategories(products, categoryTabsContainer, productCategorySelect) {
    const categories = [...new Set(products.map(p => p.category))];
    const sortedCategories = ['น้ำ', 'บุหรี่', 'ยา', 'อื่นๆ'].filter(c => categories.includes(c));
    
    if (categoryTabsContainer) {
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

    if (productCategorySelect) {
        productCategorySelect.innerHTML = sortedCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

export function renderProducts(products, liveStocks, productGridContainer) {
    const activeCategory = document.querySelector('.category-tab.active')?.dataset.category;
    if (!activeCategory) return;
    
    const productsToRender = products.filter(p => p.category === activeCategory);
    productGridContainer.innerHTML = '';
    productsToRender.forEach(p => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.dataset.productId = p.id;
        const stock = liveStocks[p.id] ?? 'N/A';
        const isOutOfStock = stock === 'N/A' || stock <= 0;
        const imagePath = p.image_url || `img/placeholder.png`;
        const displayPrice = p.prices ? 'เลือกราคา' : (p.price ? `฿${p.price}` : 'N/A');

        item.innerHTML = `
            <img src="${imagePath}" alt="${p.name}" onerror="this.src='img/placeholder.png';">
            <div class="product-name">${p.name}</div>
            <div class="product-price">${displayPrice}</div>
            <div class="product-stock" style="color: ${isOutOfStock ? '#fa383e' : '#888'};">สต็อก: ${stock}</div>
        `;
        if (isOutOfStock) item.classList.add('disabled');
        productGridContainer.appendChild(item);
    });
}

export function renderCart(cart, cartItemsContainer, totalPriceEl, checkoutButton) {
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

export function renderSalesHistory(transactions, historyTableBody, products, employeesList) {
    historyTableBody.innerHTML = '';
    if (!transactions || transactions.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">ยังไม่มีรายการขายสำหรับวันนี้</td></tr>';
        return;
    }

    const getEmployeeNameById = (id) => {
        const employee = employeesList.find(e => e.id === id);
        return employee ? employee.name : id;
    };

    transactions.forEach(tx => {
        const row = document.createElement('tr');
        const time = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const itemsString = tx.items.map(item => {
            const productInfo = products.find(p => p.id === item.product_id);
            const productName = productInfo ? productInfo.name : item.product_id;
            return `${productName} x${item.qty}`;
        }).join('\n');
        const employeeName = getEmployeeNameById(tx.employee_id);
        row.innerHTML = `
            <td>${time}</td>
            <td class="items-cell">${itemsString}</td>
            <td>฿${tx.total.toFixed(2)}</td>
            <td>${tx.payment_type === 'cash' ? 'เงินสด' : 'โอนชำระ'}</td>
            <td>${employeeName}</td>
        `;
        historyTableBody.appendChild(row);
    });
}


// --- Modal UI Functions ---

export function toggleModal(modalElement, show) {
    modalElement.style.display = show ? 'flex' : 'none';
}

export function openPriceModal(product, modalElement, addToCartCallback) {
    const modalProductName = modalElement.querySelector('#modal-product-name');
    const optionsContainer = modalElement.querySelector('#modal-price-options');
    
    modalProductName.textContent = `เลือกราคาสำหรับ: ${product.name}`;
    optionsContainer.innerHTML = '';

    const pricesToDisplay = product.prices || [];
    pricesToDisplay.forEach(price => {
        const button = document.createElement('button');
        button.className = 'price-option-button';
        button.textContent = `฿${price}`;
        button.onclick = () => {
            addToCartCallback(product.id, price);
            toggleModal(modalElement, false);
        };
        optionsContainer.appendChild(button);
    });
    toggleModal(modalElement, true);
}

export function openChangeModal(cart, modalElement, moneyReceivedInput, changeDueAmountEl) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    modalElement.querySelector('#change-modal-total').textContent = `฿${total}`;
    moneyReceivedInput.value = '';
    changeDueAmountEl.textContent = `฿0`;
    toggleModal(modalElement, true);
    moneyReceivedInput.focus();
}

export function updateChange(cart, moneyReceivedInput, changeDueAmountEl) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const received = parseFloat(moneyReceivedInput.value) || 0;
    const change = received - total;
    changeDueAmountEl.textContent = `฿${change >= 0 ? change.toFixed(2) : '0.00'}`;
}

export function displayShiftSummary(summary, modalElement) {
    modalElement.querySelector('#shift-total-sales').textContent = `฿${summary.total.toFixed(2)}`;
    modalElement.querySelector('#shift-cash-sales').textContent = `฿${summary.cash.toFixed(2)}`;
    modalElement.querySelector('#shift-transfer-sales').textContent = `฿${summary.transfer.toFixed(2)}`;
    toggleModal(modalElement, true);
}
