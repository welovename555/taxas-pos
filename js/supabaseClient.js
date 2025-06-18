import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = 'https://nmlcduawkcaaglcdlhgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbGNkdWF3a2NhYWdsY2RsaGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM3MDUsImV4cCI6MjA2NTUwOTcwNX0.1NnKZ0begtYSPF7mjDip0lYoR7w1_4qHu5aeDWLWVJY';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("ข้อผิดพลาด: การตั้งค่า Supabase ไม่สมบูรณ์");
}

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
