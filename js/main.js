// js/main.js
import { fetchProducts, fetchStock, fetchEmployees, processSale, fetchSalesHistoryForToday, endCurrentShift } from './api.js';
import {
    renderCategories, renderProducts, renderCart, renderSalesHistory,
    toggleModal, openPriceModal, openChangeModal, updateChange, displayShiftSummary
} from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        window.location.href = 'index.html';
        return;
    }

    // เช็คว่า container หลักโหลดแล้ว
    document.getElementById('app-container')?.classList.add('loaded');

    // เรียกฟังก์ชัน initializePOS จาก pos.js เดิม
    if (typeof initializePOS === 'function') {
        initializePOS(); // ให้ยังใช้ของเดิม
    } else {
        console.error('initializePOS() not defined. คุณอาจลืม import pos.js');
    }
});
