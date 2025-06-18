import { supabaseClient } from './supabaseClient.js';

export async function fetchProducts() {
    const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: true });
    if (error) {
        console.error('Error fetching products:', error);
        alert('ไม่สามารถโหลดข้อมูลสินค้าได้');
        return null;
    }
    return data;
}

export async function fetchStock() {
    const { data, error } = await supabaseClient.from('product_stocks').select('*');
    if (error) {
        console.error('โหลด stock ล้มเหลว:', error.message);
        return null;
    }
    const stockMap = {};
    data.forEach(item => {
        stockMap[item.product_id] = item.stock;
    });
    return stockMap;
}

export async function fetchEmployees() {
    const { data, error } = await supabaseClient.from('employees').select('id, name');
    if (error) {
        console.error('Error fetching employees:', error);
        return null;
    }
    return data;
}

export async function processSale(cart, currentUser, currentShiftId) {
    let shiftId = currentShiftId;
    if (!shiftId) {
        try {
            const { data, error } = await supabaseClient.from('shifts').insert({ employee_id: currentUser.id }).select().single();
            if (error) throw error;
            shiftId = data.id;
            localStorage.setItem('currentShiftId', shiftId);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเริ่มกะ: ' + error.message);
            return { success: false };
        }
    }

    const transactionId = crypto.randomUUID();
    try {
        const saleRecords = cart.map(item => ({
            transaction_id: transactionId,
            shift_id: shiftId,
            employee_id: currentUser.id,
            product_id: item.id,
            price: item.price,
            qty: item.quantity,
            payment_type: item.paymentMethod 
        }));
        const { error } = await supabaseClient.from('sales').insert(saleRecords);
        if (error) throw error;
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message);
        return { success: false };
    }

    try {
        const stockUpdates = cart.map(item => {
            const newStock = (item.currentStock || 0) - item.quantity;
            return supabaseClient.from('product_stocks').update({ stock: newStock }).eq('product_id', item.id);
        });
        await Promise.all(stockUpdates);
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการอัปเดตสต็อก: ' + error.message);
        return { success: false };
    }
    
    return { success: true, newShiftId: shiftId };
}


export async function fetchSalesHistoryForToday() {
    const today = new Date();
    if (today.getHours() < 6) { 
        today.setDate(today.getDate() - 1);
    }
    today.setHours(6, 0, 0, 0); 
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);

    const { data, error } = await supabaseClient
        .from('sales')
        .select('*')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sales history:', error.message);
        alert('ไม่สามารถโหลดประวัติการขายได้: ' + error.message);
        return null;
    }
    return data;
}


export async function endCurrentShift(shiftId) {
    try {
        const { data: shiftStatus, error: statusError } = await supabaseClient.from('shifts').select('end_time').eq('id', shiftId).single();
        if (statusError) throw new Error('ไม่พบข้อมูลกะปัจจุบันในระบบ อาจถูกลบไปแล้ว');
        if (shiftStatus.end_time) {
            alert('กะนี้ได้ถูกปิดไปแล้ว');
            localStorage.removeItem('currentShiftId');
            return { alreadyClosed: true };
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
        
        return { success: true, summary: summary };

    } catch (error) {
        alert('เกิดข้อผิดพลาดในการปิดกะ: ' + error.message);
        return { success: false };
    }
}
