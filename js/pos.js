// js/pos.js (ฉบับแก้ไข - เอา employee_name ออกจากการสร้างกะ)

document.addEventListener('DOMContentLoaded', () => {
    // ... (ส่วนที่ 1: ตรวจสอบการล็อกอิน และ UI พื้นฐาน) ...

    // =================================================================
    // ส่วนที่ 2: ระบบ POS
    // =================================================================
    
    // ... (const products, let liveStocks, let cart) ...
    // ... (UI elements, Modal elements) ...
    // ... (Render Functions, Data Handlers, Modal Functions) ...
    // ... (Real-time & Data Fetching) ...

    // ---- ⭐️⭐️ CORE SALE PROCESS ⭐️⭐️ ----
    async function processSale(paymentMethod) {
        if (cart.length === 0) return;

        closePaymentModal();
        closeChangeModal();

        const total_price = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shiftId = sessionStorage.getItem('currentShiftId');

        // 1. จัดการเรื่องกะ (Shift)
        if (!shiftId) {
            try {
                // --- ส่วนที่แก้ไข ---
                // เอา employee_name ออก เพราะในตารางไม่มีคอลัมน์นี้
                const { data, error } = await supabaseClient
                    .from('shifts')
                    .insert({ employee_id: currentUser.id }) // <--- แก้ไขบรรทัดนี้
                    .select()
                    .single();
                // --- สิ้นสุดส่วนที่แก้ไข ---
                
                if (error) throw error;
                shiftId = data.id;
                sessionStorage.setItem('currentShiftId', shiftId);
                console.log('เริ่มกะใหม่:', shiftId);
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการเริ่มกะ: ' + error.message);
                return;
            }
        }
        
        // 2. บันทึกข้อมูลการขาย
        try {
            const saleRecord = {
                shift_id: shiftId,
                employee_id: currentUser.id,
                employee_name: currentUser.name,
                items: cart,
                total_price: total_price,
                payment_method: paymentMethod
            };
            const { error: saleError } = await supabaseClient.from('sales').insert(saleRecord);
            if (saleError) throw saleError;
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message);
            return;
        }

        // 3. อัปเดตสต็อกสินค้า
        try {
            const stockUpdates = cart.map(item => {
                const newStock = (liveStocks[item.id] || 0) - item.quantity;
                return supabaseClient.from('product_stocks').update({ stock: newStock }).eq('product_id', item.id);
            });
            await Promise.all(stockUpdates);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการอัปเดตสต็อก: ' + error.message);
            return;
        }

        // 4. เสร็จสิ้นกระบวนการ
        alert('บันทึกการขายสำเร็จ!');
        cart = [];
        renderCart();
    }

    // ... (Event Listeners ทั้งหมด) ...
    // ... (Initialize POS) ...
});


// หมายเหตุ: ผมได้ย่อโค้ดส่วนที่ไม่เปลี่ยนแปลงไว้ (`...`) เพื่อให้คุณเห็นจุดที่แก้ไขได้ง่าย
// แต่ไฟล์ที่คุณจะนำไปใช้จริง ผมขอแนะนำให้ใช้ **ไฟล์ฉบับเต็มจากแชทที่ 33** แล้วแก้แค่บรรทัด `insert` ในฟังก์ชัน `processSale` เพียงจุดเดียวครับ
// คือแก้จาก: .insert({ employee_id: currentUser.id, employee_name: currentUser.name })
// เป็น:     .insert({ employee_id: currentUser.id })
