// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const employeeCodeInput = document.getElementById('employee-code');
    const errorMessage = document.getElementById('login-error');

    // หากผู้ใช้เคยล็อกอินแล้ว (มีข้อมูลใน sessionStorage) ให้ redirect ไปหน้า pos.html เลย
    // ป้องกันการเข้ามาหน้า login ซ้ำโดยไม่จำเป็น
    if (sessionStorage.getItem('currentUser')) {
        window.location.href = 'pos.html';
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        // ป้องกันไม่ให้หน้าเว็บโหลดใหม่เมื่อกดยืนยันฟอร์ม
        event.preventDefault();
        
        const code = employeeCodeInput.value;
        errorMessage.textContent = ''; // ล้างข้อความ error เก่า

        // ตรวจสอบเบื้องต้น
        if (!code || code.length !== 4) {
            errorMessage.textContent = 'กรุณากรอกรหัส 4 หลักให้ถูกต้อง';
            return;
        }

        try {
            // ส่งคำสั่งไปที่ Supabase เพื่อค้นหา user ที่มี 'code' ตรงกับที่กรอก
            const { data, error } = await supabase
                .from('users') // ชื่อตาราง 'users'
                .select('id, name, role') // เลือกคอลัมน์ที่ต้องการ: id, name, role
                .eq('code', code) // เงื่อนไข: คอลัมน์ 'code' ต้องเท่ากับ code ที่รับมา
                .single(); // คาดหวังผลลัพธ์เดียว (ถ้าเจอมากกว่า 1 หรือไม่เจอเลย จะเป็น error)

            if (error) {
                // ถ้า .single() ไม่เจอข้อมูล หรือเจอมากกว่า 1 จะเข้าเงื่อนไขนี้
                console.error('Login Error:', error.message);
                errorMessage.textContent = 'รหัสพนักงานไม่ถูกต้อง';
                employeeCodeInput.value = ''; // เคลียร์ช่อง input
                return;
            }

            if (data) {
                // ถ้าเจอข้อมูล...
                console.log('Login successful for:', data.name);
                
                // บันทึกข้อมูลผู้ใช้ลงใน sessionStorage
                // sessionStorage จะเก็บข้อมูลไว้จนกว่าจะปิดแท็บเบราว์เซอร์
                sessionStorage.setItem('currentUser', JSON.stringify(data));
                
                // ส่งผู้ใช้ไปยังหน้า POS หลัก
                window.location.href = 'pos.html';
            }

        } catch (err) {
            console.error('An unexpected error occurred:', err);
            errorMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        }
    });
});

