// js/supabaseClient.js (ฉบับแก้ไข)

const SUPABASE_URL = 'https://nmlcduawkcaaglcdlhgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbGNkdWF3a2NhYWdsY2RsaGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM3MDUsImV4cCI6MjA2NTUwOTcwNX0.1NnKZ0begtYSPF7mjDip0lYoR7w1_4qHu5aeDWLWVJY';

// ตรวจสอบว่าใส่ค่าแล้วหรือยัง
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("ข้อผิดพลาด: การตั้งค่า Supabase ไม่สมบูรณ์");
}

// --- ส่วนที่แก้ไข ---
// เราจะใช้ object `supabase` ที่มาจาก CDN script เพื่อสร้าง client ของเรา
// และเก็บไว้ในตัวแปรใหม่ชื่อ `supabaseClient` เพื่อไม่ให้สับสน
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- สิ้นสุดส่วนที่แก้ไข ---