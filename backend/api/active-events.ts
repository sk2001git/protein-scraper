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
    .insert([{ id: 0, discount_id }]);

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

    // Note that the next 2 step are to deal with active_event table
  // Deactivate current event (Clear all event since it will only have 1 row) 
  await deactivateCurrentEvent(supabase);

  // Activate the new event
  await activateNewEvent(discountId, supabase);

  const currentActiveEvent = await getCurrentActiveEvent(supabase);
  // Update end date of previous active date range (if any) - deals with discount_date_ranges table
  if (previousActiveEvent && currentActiveEvent?.discount_id != previousActiveEvent?.discount_id) {
    const previousDateRange = await getActiveDiscountDateRanges(previousActiveEvent.discount_id, supabase);
    if (previousDateRange) {
      await updateEndDate(previousDateRange.id, new_start_date, supabase);
    }
  }
  // Adds a new date range for the new event
  await addDiscountDateRange(discountId, new_start_date, null, supabase);
}