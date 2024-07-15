import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

interface PriceDetails {
  id?: number;
  price: number;
  productid: number;
  discount_percentage: number;
}

export const runtime = 'edge';

export const insertPrice = async (priceString: string, productId: number, discount_id:number, option_id:number, supabase: SupabaseClient): Promise<NextResponse | PriceDetails[]> => {
  const { data: price, error: insertError, status: insertStatus } = await supabase
  .from('price')
  .insert({
    price: parseFloat(priceString.replace(/[^0-9.-]+/g, "")),
    productid: productId,
    discount_id: discount_id,
    option_id: option_id
  })
  .select();

  if (insertError) {
    console.error('Error inserting price:', insertError);
    return NextResponse.json({ error: 'Failed to insert price', details: insertError.message, status: insertStatus }, { status: 500 });
  }
  return price;

}