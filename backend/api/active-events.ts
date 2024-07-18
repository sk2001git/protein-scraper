import { SupabaseClient } from '@supabase/supabase-js';
import { addDiscountDateRange, getActiveDiscountDateRanges, updateEndDate } from './discount-date-ranges';

export const runtime = 'edge';

interface ActiveEvent {
  discount_id: number;
  activated_at: string;
}

/**
 * Deactivates the current active event
 * @param supabase - The Supabase client
 * @returns void
 */
const deactivateCurrentEvent = async (supabase: SupabaseClient): Promise<void> => {
  const { data, error } = await supabase
    .from('active_event')
    .delete()
    .neq('discount_id', 0); // This ensures all rows are deleted since only one should exist

  if (error) {
    throw error;
  }
};

/**
 *  Activates a new event
 * @param discount_id - The ID of the discount to activate
 * @param supabase 
 */
const activateNewEvent = async (discount_id: number, supabase: SupabaseClient): Promise<void> => {
  const { data, error } = await supabase
    .from('active_event')
    .upsert([{ id: 0, discount_id }, { onConflict: 'discount_id' }]);

  if (error) {
    throw error;
  }
};

/**
 * Get the current active event
 * @param supabase 
 * @returns  the current active event
 */
const getCurrentActiveEvent = async (supabase: SupabaseClient): Promise<ActiveEvent | null> => {
  const { data, error } = await supabase
    .from('active_event')
    .select('discount_id, activated_at')
    .single();

  if (error && error.code === 'PGRST116') {
    return null; 
  } else if (error) {
    throw error; 
  }
  return data;
};

/**
 * Deactivates the current active event and activates a new event. 
 * Updates the end date of the previous event,
 * Adds a new date range for the new event.
 * @param new_start_date  start date of the new event
 * @param discountId ID of the discount to activate 
 * @param supabase  The Supabase client
 * @returns void
 */
export const changeActiveEvent = async (
  new_start_date: Date,
  discountId: number,
  supabase: SupabaseClient
):Promise<void> => { 
  const previousActiveEvent = await getCurrentActiveEvent(supabase);

  // No change in active event
  if (previousActiveEvent?.discount_id === discountId) {
    // No change in active event
    return;
  }

  // Deactivate current event if there is one
  if (previousActiveEvent) {
    await deactivateCurrentEvent(supabase);
  }

  // Activate new event 
  await activateNewEvent(discountId, supabase);

  // Update the end date of the previous event
  if (previousActiveEvent) {
    const previousDateRange = await getActiveDiscountDateRanges(previousActiveEvent.discount_id, supabase);
    if (previousDateRange) {
      await updateEndDate(previousDateRange.id, new_start_date, supabase);
    }
  }

  // Add a new date range for the new event
  await addDiscountDateRange(discountId, new_start_date, null, supabase);
}