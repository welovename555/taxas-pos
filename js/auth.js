// js/auth.js (ฉบับแก้ไข)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const employeeCodeInput = document.getElementById('employee-code');
    const errorMessage = document.getElementById('login-error');

    if (sessionStorage.getItem('currentUser')) {
        window.location.href = 'pos.html';
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const code = employeeCodeInput.value;
        errorMessage.textContent = '';

        if (!code || code.length !== 4) {
            errorMessage.textContent = 'กรุณากรอกรหัส 4 หลักให้ถูกต้อง';
            return;
        }

        try {
            // --- ส่วนที่แก้ไข ---
            // เปลี่ยนจาก supabase เป็น supabaseClient
            const { data, error } = await supabaseClient
                .from('employees')
                .select('id, name, role')
                .eq('id', code)
                .single();
            // --- สิ้นสุดส่วนที่แก้ไข ---

            if (error) {
                console.error('Login Error:', error.message);
                errorMessage.textContent = 'รหัสพนักงานไม่ถูกต้อง';
                employeeCodeInput.value = '';
                return;
            }

            if (data) {
                console.log('Login successful for:', data.name);
                sessionStorage.setItem('currentUser', JSON.stringify(data));
                window.location.href = 'pos.html';
            }

        } catch (err) {
            console.error('An unexpected error occurred:', err);
            errorMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        }
    });
});