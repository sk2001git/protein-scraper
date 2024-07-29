import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

interface PriceDetails {
  id?: number;
  price: number;
}

export const runtime = 'edge';

export const insertPrices = async (priceData: { price: number; discount_id: number; option_id: number }[], supabase: SupabaseClient): Promise<NextResponse | PriceDetails[]> => {
  const { data: prices, error: insertError, status: insertStatus } = await supabase
    .from('price')
    .insert(priceData)
    .select();

  if (insertError) {
    console.error('Error inserting prices:', insertError);
    return NextResponse.json({ error: 'Failed to insert prices', details: insertError.message, status: insertStatus }, { status: 500 });
  }
  return prices;
};