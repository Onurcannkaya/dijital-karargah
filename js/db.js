/**
 * db.js — Dijital Karargâh Veri Katmanı v2.0 (Final Strike)
 * Supabase PostgreSQL + Auth + Realtime + RSVP entegrasyonu.
 */

// ─────────────────────────────────────────────
// SUPABASE İSTEMCİSİ
// ─────────────────────────────────────────────
const supabaseUrl = 'https://rnvzzkajaxxjpkltvorv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnp6a2FqYXh4anBrbHR2b3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjEzMzMsImV4cCI6MjA4NzkzNzMzM30.6NxzAeAMBX93JNFk0K_kJ8PzXGBpVSS2Id6PNSJhJts';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ─────────────────────────────────────────────
// KATEGORİLER
// ─────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'belediye', label: 'Belediye & Harita Mesaisi', color: '#2196F3', bg: 'rgba(33,150,243,0.15)', icon: '🏛️' },
  { id: 'akademi', label: 'Akademi & Tez', color: '#9C27B0', bg: 'rgba(156,39,176,0.15)', icon: '🎓' },
  { id: 'stk', label: 'STK & Gençlik', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)', icon: '🌱' },
  { id: 'kisisel', label: 'Kişisel & Rutin', color: '#F44336', bg: 'rgba(244,67,54,0.15)', icon: '⚡' }
];

// ─────────────────────────────────────────────
// ALAN ADI DÖNÜŞTÜRÜCÜLER
// ─────────────────────────────────────────────

function toCamelCase(row) {
  if (!row.id) {
    console.warn('[DB] toCamelCase: satırda id eksik!', row);
  }
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category || row.category_id,
    dueDate: row.due_date || row.date,
    priority: row.priority,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
    userId: row.user_id || null,
    visibility: row.visibility || 'private',
    assignedTo: row.assigned_to || null,
    attendees: row.attendees || []
  };
}

function toSnakeCase(data) {
  const mapped = {};
  if (data.title !== undefined) mapped.title = data.title;
  if (data.categoryId !== undefined) mapped.category = data.categoryId;
  if (data.dueDate !== undefined) mapped.date = data.dueDate;
  if (data.priority !== undefined) mapped.priority = data.priority;
  if (data.completed !== undefined) mapped.completed = data.completed;
  if (data.visibility !== undefined) mapped.visibility = data.visibility;
  if (data.assignedTo !== undefined) mapped.assigned_to = data.assignedTo;
  if (data.attendees !== undefined) mapped.attendees = data.attendees;
  return mapped;
}

// ─────────────────────────────────────────────
// DATABASE SINIFI
// ─────────────────────────────────────────────

class Database {
  constructor() {
    this._client = supabaseClient;
    this._initialized = false;
    this._realtimeChannel = null;
  }

  async init() {
    if (this._initialized) return;
    try {
      const { error } = await this._client.from('tasks').select('id').limit(1);
      if (error) throw error;
      this._initialized = true;
    } catch (err) {
      console.error('[DB] Supabase bağlantı hatası:', err.message);
      this._initialized = true;
    }
  }

  // ─── AUTH ──────────────────────────────────────

  async signUp(email, password) {
    try {
      const { data, error } = await this._client.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Kayıt hatası:', err.message);
      throw err;
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this._client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Giriş hatası:', err.message);
      throw err;
    }
  }

  async signOut() {
    try {
      this.unsubscribeRealtime();
      const { error } = await this._client.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('[Auth] Çıkış hatası:', err.message);
      throw err;
    }
  }

  async getUser() {
    try {
      const { data: { user } } = await this._client.auth.getUser();
      return user;
    } catch { return null; }
  }

  async getSession() {
    try {
      const { data: { session } } = await this._client.auth.getSession();
      return session;
    } catch { return null; }
  }

  onAuthChange(callback) {
    return this._client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // ─── REALTIME ──────────────────────────────────

  /**
   * tasks tablosundaki INSERT olaylarını dinler.
   * @param {Function} onInsert — yeni satır geldiğinde çağrılır (camelCase payload)
   */
  subscribeToTasks(onInsert) {
    if (this._realtimeChannel) {
      this._client.removeChannel(this._realtimeChannel);
    }

    this._realtimeChannel = this._client
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.new) {
            onInsert(toCamelCase(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        () => { }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        () => { }
      )
      .subscribe(() => { });

    return this._realtimeChannel;
  }

  unsubscribeRealtime() {
    if (this._realtimeChannel) {
      this._client.removeChannel(this._realtimeChannel);
      this._realtimeChannel = null;
    }
  }

  // ─── GÖREV CRUD ────────────────────────────────

  async getTasks() {
    try {
      const user = await this.getUser();
      let query = this._client
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        console.log('[DB] getTasks çağrılıyor. Kullanıcı:', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      console.log('[DB] getTasks: ham veri', data?.length, 'satır');
      return (data || []).map(toCamelCase);
    } catch (err) {
      console.error('[DB] getTasks hatası:', err.message);
      return [];
    }
  }

  async getTaskById(id) {
    try {
      const { data, error } = await this._client.from('tasks').select('*').eq('id', id).single();
      if (error) throw error;
      return data ? toCamelCase(data) : null;
    } catch (err) {
      console.error('[DB] getTaskById hatası:', err.message);
      return null;
    }
  }

  async addTask(taskData) {
    try {
      const { data: { user } } = await this._client.auth.getUser();
      if (!user) throw new Error("Görev eklemek için giriş yapmalısınız!");

      const row = {
        title: taskData.title.trim(),
        category: taskData.categoryId,
        date: taskData.dueDate || new Date().toISOString().split('T')[0],
        priority: taskData.priority || 'medium',
        completed: false,
        user_id: user.id,
        visibility: taskData.visibility || 'private',
        assigned_to: taskData.assignedTo || null,
        attendees: []
      };

      console.log('[DB] addTask: ekleniyor...', { title: row.title, user_id: row.user_id, visibility: row.visibility });

      const { data, error } = await this._client.from('tasks').insert([row]).select();

      if (error) {
        console.error('[DB] Supabase Insert Error:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('[DB] addTask: sonuç data =', data);

      if (!data || data.length === 0) {
        throw new Error('İşlem reddedildi: Görev eklenemedi (yetki veya veri hatası).');
      }

      const result = toCamelCase(data[0]);
      console.log('[DB] addTask: başarılı, id =', result.id);
      return result;
    } catch (err) {
      console.error('[DB] addTask genel hatası:', err.message);
      throw err;
    }
  }

  async toggleTask(id) {
    try {
      const current = await this.getTaskById(id);
      if (!current) throw new Error(`Görev bulunamadı: ${id}`);
      const { data, error } = await this._client
        .from('tasks')
        .update({ completed: !current.completed })
        .eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('İşlem reddedildi: Görev güncellenemedi (yetki hatası).');
      }
      return toCamelCase(data[0]);
    } catch (err) {
      console.error('[DB] toggleTask hatası:', err.message);
      throw err;
    }
  }

  /**
   * Görev sil — sahiplik doğrulaması + basit silme.
   */
  async deleteTask(id) {
    try {
      // Sahiplik kontrolü
      const { data: { user } } = await this._client.auth.getUser();
      if (!user) throw new Error('Silmek için giriş yapmalısınız.');

      // Sil
      const { error } = await this._client.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('[DB] Supabase Delete Error:', error);
        throw new Error(`Silme hatası: ${error.message}`);
      }

      console.log('[DB] deleteTask: başarılı, id =', id);
      return true;
    } catch (err) {
      console.error('[DB] deleteTask hatası:', err.message);
      throw err;
    }
  }

  async updateTask(id, updates) {
    try {
      const row = toSnakeCase(updates);
      const { data, error } = await this._client.from('tasks').update(row).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('İşlem reddedildi: Görev güncellenemedi (yetki veya ID hatası).');
      }
      return toCamelCase(data[0]);
    } catch (err) {
      console.error('[DB] updateTask hatası:', err.message);
      throw err;
    }
  }

  /**
   * RSVP — Katılım durumunu güncelle
   * @param {string} id — görev UUID
   * @param {string} email — kullanıcı e-postası
   * @param {boolean} isJoining — katılıyor mu?
   */
  async rsvpTask(id, email, isJoining) {
    try {
      const task = await this.getTaskById(id);
      if (!task) throw new Error('Görev bulunamadı');
      let attendees = Array.isArray(task.attendees) ? [...task.attendees] : [];
      if (isJoining) {
        if (!attendees.includes(email)) attendees.push(email);
      } else {
        attendees = attendees.filter(e => e !== email);
      }
      const { data, error } = await this._client
        .from('tasks').update({ attendees }).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('İşlem reddedildi: RSVP güncellenemedi.');
      }
      return toCamelCase(data[0]);
    } catch (err) {
      console.error('[DB] rsvpTask hatası:', err.message);
      throw err;
    }
  }

  async getStats() {
    try {
      const tasks = await this.getTasks();
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const pending = total - completed;
      const byCategory = {};
      CATEGORIES.forEach(c => { byCategory[c.id] = tasks.filter(t => t.categoryId === c.id).length; });
      return { total, completed, pending, byCategory };
    } catch (err) {
      console.error('[DB] getStats hatası:', err.message);
      return { total: 0, completed: 0, pending: 0, byCategory: {} };
    }
  }
}

export const db = new Database();
