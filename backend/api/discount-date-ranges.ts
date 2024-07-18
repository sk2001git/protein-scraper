import { SupabaseClient } from "@supabase/supabase-js";

export const runtime = 'edge';

interface DiscountDate {
  id: number;
  start_date: string;
  end_date? : string;
}

export const getActiveDiscountDateRanges = async (
  id:number, 
  supabase: SupabaseClient
): Promise<DiscountDate | null> => {
  const {data, error} = await supabase
    .from('discount_date_ranges')
    .select('id, start_date, end_date')
    .eq('discount_id', id)
    .is('end_date', null)
    .single();
  if (error && error.code === 'PGRST116') {
    return null;
  } else if (error) {
    throw error;
  }
  return data;
}

export const updateEndDate = async (
  id: number,
  endDate: Date,
  supabase: SupabaseClient
): Promise<void> => {
  const { data, error } = await supabase
    .from('discount_date_ranges')
    .update({ end_date: endDate })
    .eq('id', id);
  if (error) {
    throw error;
  }
}

export const addDiscountDateRange = async (
  discountId: number,
  startDate: Date,
  endDate: Date | null,
  supabase: SupabaseClient
): Promise<void> => {
  const { data, error } = await supabase
    .from('discount_date_ranges')
    .upsert([{ discount_id: discountId, start_date: startDate, end_date: endDate }]);
  if (error) {
    throw error;
  }
}