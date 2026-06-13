import { supabase } from '../lib/supabase';

/**
 * Fetch all saved addresses for a user.
 */
export async function getAddresses(userId) {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getAddresses error:', err);
    throw err;
  }
}

/**
 * Add a new address.
 */
export async function addAddress(addressData) {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert([addressData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('addAddress error:', err);
    throw err;
  }
}

/**
 * Delete an address by id.
 */
export async function deleteAddress(id) {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteAddress error:', err);
    throw err;
  }
}

/**
 * Set an address as default. Clears other defaults for same user first.
 */
export async function setDefaultAddress(id, userId) {
  try {
    // Clear existing default
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('setDefaultAddress error:', err);
    throw err;
  }
}
