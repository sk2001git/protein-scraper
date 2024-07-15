import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export interface URLUpdate {
  product_id: number;
  url: string;
}

/**
 * Upserts the URL record in the urls table
 * @param urlUpdate  The URL update details
 * @param supabase   The Supabase client 
 * @returns          The updated URL record else a NextResponse denoting an error
 */
export const upsertURL = async (urlUpdate: URLUpdate, supabase: SupabaseClient): Promise<URLUpdate> => {
  const { product_id, url } = urlUpdate;
  
  const { data, error, status: httpStatus } = await supabase
    .from('urls')
    .upsert(
      {
        product_id: product_id,
        url: url,
        last_scraped_at: new Date(),
      },
      { onConflict: 'product_id' }
    )
    .select();

  if (error) {
    console.error('Error upserting URL:', error);
    throw error;
  }
  
  if (data) {
    return data[0];
  }
  throw new Error('Failed to update URL');
};