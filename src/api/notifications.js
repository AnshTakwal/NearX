import { supabase } from '../lib/supabase';

/**
 * Fetch all notifications for a user, newest first.
 */
export async function getNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getNotifications error:', err);
    throw err;
  }
}

/**
 * Mark a specific notification as read.
 */
export async function markAsRead(id) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('markAsRead error:', err);
    throw err;
  }
}

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadCount(userId) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return 0;
  }
}
