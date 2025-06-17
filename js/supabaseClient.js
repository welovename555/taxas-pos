// js/supabaseClient.js

// ข้อมูลการเชื่อมต่อ Supabase ของคุณ
const SUPABASE_URL = 'https://nmlcduawkcaaglcdlhgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbGNkdWF3a2NhYWdsY2RsaGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM3MDUsImV4cCI6MjA2NTUwOTcwNX0.1NnKZ0begtYSPF7mjDip0lYoR7w1_4qHu5aeDWLWVJY';

// ตรวจสอบว่าค่าที่ใส่ถูกต้องหรือไม่ (เป็น optional check)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("ข้อผิดพลาด: การตั้งค่า Supabase ไม่สมบูรณ์");
    alert("การตั้งค่า Supabase ไม่สมบูรณ์ กรุณาติดต่อผู้ดูแลระบบ");
}

// สร้างและ export Supabase client สำหรับให้ไฟล์อื่นเรียกใช้
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

