import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Fetching exchange rate...')
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL')
        const data = await response.json()

        if (!data.USDBRL) {
            throw new Error('Invalid API response')
        }

        const rate = parseFloat(data.USDBRL.bid)

        console.log(`Rate fetched: ${rate}`)

        const { error } = await supabaseClient
            .from('exchange_rates')
            .insert({
                currency_from: 'USD',
                currency_to: 'BRL',
                rate: rate,
                timestamp: new Date().toISOString()
            })

        if (error) throw error

        return new Response(
            JSON.stringify({ success: true, rate }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
