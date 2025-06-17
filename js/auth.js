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
            const { data: userData, error: userError } = await supabaseClient
                .from('employees')
                .select('id, name, role')
                .eq('id', code)
                .single();

            if (userError) {
                console.error('Login Error:', userError.message);
                errorMessage.textContent = 'รหัสพนักงานไม่ถูกต้อง';
                employeeCodeInput.value = '';
                return;
            }

            if (userData) {
                console.log('Login successful for:', userData.name);
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                
                // ไม่มีการเช็คกะค้างที่นี่อีกต่อไป
                // ทำให้หน้าที่ของหน้านี้เรียบง่ายและลดโอกาสเกิดข้อผิดพลาด
                
                window.location.href = 'pos.html';
            }

        } catch (err) {
            console.error('An unexpected error occurred:', err);
            errorMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        }
    });
});
