document.addEventListener('DOMContentLoaded', () => {
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

    let products = [];
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
    const historyTableBody = document.getElementById('history-table-body');
    const loadingOverlay = document.getElementById('loading-overlay');
    const endShiftButton = document.getElementById('end-shift-button');
    const shiftSummaryModal = document.getElementById('shift-summary-modal');
    const stockListContainer = document.getElementById('stock-list-container');
    const stockSearchInput = document.getElementById('stock-search-input');
    const productAdminListContainer = document.getElementById('product-admin-list');
    const addNewProductBtn = document.getElementById('add-new-product-btn');
    const productFormModal = document.getElementById('product-form-modal');
    const productForm = document.getElementById('product-form');
    const productFormTitle = document.getElementById('product-form-title');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productCategorySelect = document.getElementById('product-category');
    const productPriceInput = document.getElementById('product-price');
    const isMultiPriceCheckbox = document.getElementById('is-multi-price');
    const multiPriceRow = document.getElementById('multi-price-row');
    const productPricesInput = document.getElementById('product-prices');
    const imagePreview = document.getElementById('image-preview');
    const imageUploadInput = document.getElementById('image-upload-input');
    const imageUploadButton = document.getElementById('image-upload-button');

    let isEditMode = false;
    let editingProductId = null;
    let selectedFile = null;
    let categoriesList = [];

    function renderCategories() {
        categoriesList = [...new Set(products.map(p => p.category_id))].map(id => {
            const sampleProduct = products.find(p => p.category_id === id);
            return { id: id, name: sampleProduct ? sampleProduct.category : id };
        });
        const sortedCategories = ['น้ำ', 'บุหรี่', 'ยา', 'อื่นๆ'];
        let displayCategories = categoriesList.map(c => c.name);
        displayCategories.sort((a,b) => sortedCategories.indexOf(a) - sortedCategories.indexOf(b));

        categoryTabsContainer.innerHTML = '';
        displayCategories.forEach((category, index) => {
            const tab = document.createElement('div');
            tab.className = 'category-tab';
            tab.textContent = category;
            tab.dataset.category = category;
            if (index === 0) tab.classList.add('active');
            categoryTabsContainer.appendChild(tab);
        });
    }

    function getCategoryNameById(id) {
        const category = categoriesList.find(c => c.id === id);
        return category ? category.name : 'N/A';
    }

    function getCategoryByName(name) {
        const category = categoriesList.find(c => c.name === name);
        return category;
    }
    
    function renderProducts(categoryName) {
        const category = getCategoryByName(categoryName);
        if (!category) {
            productGridContainer.innerHTML = '';
            return;
        }
        const productsToRender = products.filter(p => p.category_id === category.id);
        productGridContainer.innerHTML = '';
        productsToRender.forEach(p => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.dataset.productId = p.id;
            const stock = liveStocks[p.id] ?? 'N/A';
            const isOutOfStock = stock === 'N/A' || stock <= 0;
            const imagePath = p.image_url || `img/placeholder.png`;
            const displayPrice = p.prices ? 'เลือกราคา' : (p.price ? `฿${p.price}` : 'N/A');
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

    async function fetchProducts() {
        const { data, error } = await supabaseClient.from('products').select('*, categories(name)');
        if (error) { console.error('Error fetching products:', error); alert('ไม่สามารถโหลดข้อมูลสินค้าได้'); return false; }
        
        products = data.map(p => ({
            ...p,
            category: p.categories.name 
        }));
        
        return true;
    }

    async function initializePOS() {
        loadingOverlay.style.display = 'flex';
        const productsLoaded = await fetchProducts();
        if (!productsLoaded) { loadingOverlay.style.display = 'none'; return; }
        await fetchStockFromSupa();
        renderCategories();
        const initialCategory = document.querySelector('.category-tab.active')?.dataset.category;
        if (initialCategory) { renderProducts(initialCategory); }
        renderCart();
        loadingOverlay.style.display = 'none';
    }

    // --- Admin Product Management Functions ---
    
    function renderAdminProductList() {
        productAdminListContainer.innerHTML = '';
        products.forEach(p => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = `
                <img src="${p.image_url || 'img/placeholder.png'}" class="image-preview" style="width: 50px; height: 50px;">
                <div class="admin-item-info">
                    <div class="admin-item-name">${p.name}</div>
                    <div class="admin-item-id">ID: ${p.id}</div>
                </div>
                <button class="edit-btn" data-product-id="${p.id}">แก้ไข</button>
            `;
            productAdminListContainer.appendChild(item);
        });
    }

    async function generateNewProductId(categoryId) {
        const categoryPrefixMap = { 'C001': 'CIG', 'C002': 'MED', 'C003': 'A', 'C004': 'B' };
        const prefix = categoryPrefixMap[categoryId] || 'P';

        const { data, error } = await supabaseClient
            .from('products')
            .select('id')
            .like('id', `${prefix}%`)
            .order('id', { ascending: false })
            .limit(1);

        if (error) { console.error(error); return `${prefix}001`; }

        if (data.length === 0) {
            return `${prefix}001`;
        }

        const lastId = data[0].id;
        const lastNumber = parseInt(lastId.replace(prefix, ''), 10);
        const newNumber = lastNumber + 1;
        return `${prefix}${String(newNumber).padStart(3, '0')}`;
    }

    function openProductForm(mode, product = null) {
        productForm.reset();
        selectedFile = null;
        imagePreview.src = 'img/placeholder.png';
        multiPriceRow.style.display = 'none';

        productCategorySelect.innerHTML = categoriesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        if (mode === 'edit') {
            isEditMode = true;
            editingProductId = product.id;
            productFormTitle.textContent = 'แก้ไขสินค้า';
            productIdInput.value = product.id;
            productNameInput.value = product.name;
            productCategorySelect.value = product.category_id;
            productCategorySelect.disabled = true;
            imagePreview.src = product.image_url || 'img/placeholder.png';
            
            if (product.prices && product.prices.length > 0) {
                isMultiPriceCheckbox.checked = true;
                multiPriceRow.style.display = 'block';
                productPricesInput.value = product.prices.join(',');
                productPriceInput.value = '';
                productPriceInput.disabled = true;
            } else {
                isMultiPriceCheckbox.checked = false;
                productPriceInput.value = product.price;
                productPricesInput.value = '';
                productPriceInput.disabled = false;
            }

        } else {
            isEditMode = false;
            editingProductId = null;
            productFormTitle.textContent = 'เพิ่มสินค้าใหม่';
            productCategorySelect.disabled = false;
            productIdInput.value = 'กรุณาเลือกหมวดหมู่ก่อน';
        }
        productFormModal.style.display = 'flex';
    }

    async function handleProductFormSubmit(event) {
        event.preventDefault();
        loadingOverlay.style.display = 'flex';

        const formData = new FormData(productForm);
        const newId = isEditMode ? editingProductId : await generateNewProductId(formData.get('category_id'));
        let publicUrl = isEditMode ? products.find(p=>p.id === editingProductId).image_url : null;
        
        try {
            if (selectedFile) {
                const filePath = `${newId}.${selectedFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabaseClient.storage
                    .from('product-images')
                    .upload(filePath, selectedFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabaseClient.storage
                    .from('product-images')
                    .getPublicUrl(filePath);
                
                publicUrl = urlData.publicUrl;
            }

            const dataToSave = {
                id: newId,
                name: formData.get('name'),
                category_id: formData.get('category_id'),
                price: isMultiPriceCheckbox.checked ? null : parseFloat(formData.get('price')),
                prices: isMultiPriceCheckbox.checked ? formData.get('prices').split(',').map(Number) : null,
                image_url: publicUrl
            };

            if (isEditMode) {
                const { error } = await supabaseClient.from('products').update(dataToSave).eq('id', editingProductId);
                if (error) throw error;
            } else {
                const { error: productError } = await supabaseClient.from('products').insert(dataToSave);
                if (productError) throw productError;

                const { error: stockError } = await supabaseClient.from('product_stocks').insert({ product_id: newId, stock: 0 });
                if (stockError) throw stockError;
            }
            
            alert(`บันทึกสินค้า '${dataToSave.name}' สำเร็จ!`);
            productFormModal.style.display = 'none';
            await initializePOS(); 
            renderAdminProductList();

        } catch (error) {
            console.error('Error saving product:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกสินค้า: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    // --- Event Listeners ---
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
        } else if (tabName === 'product-admin-view') {
            renderAdminProductList();
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

    addNewProductBtn.addEventListener('click', () => openProductForm('add'));

    productAdminListContainer.addEventListener('click', e => {
        if (e.target.classList.contains('edit-btn')) {
            const productId = e.target.dataset.productId;
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                openProductForm('edit', productToEdit);
            }
        }
    });

    imageUploadButton.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
            };
            reader.readAsDataURL(selectedFile);
        }
    });

    isMultiPriceCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        multiPriceRow.style.display = isChecked ? 'block' : 'none';
        productPriceInput.disabled = isChecked;
        if (isChecked) productPriceInput.value = '';
    });
    
    productCategorySelect.addEventListener('change', async (e) => {
        if (!isEditMode) {
            const categoryId = e.target.value;
            productIdInput.value = 'กำลังสร้าง...';
            productIdInput.value = await generateNewProductId(categoryId);
        }
    });

    productForm.addEventListener('submit', handleProductFormSubmit);
    document.getElementById('product-form-close-btn').addEventListener('click', () => productFormModal.style.display = 'none');
    
    endShiftButton.addEventListener('click', endCurrentShift);
    
    initializePOS();
});
