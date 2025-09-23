import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The full, expanded list of categories and keywords
const categories = {
  'climate-change': ['climate', 'warming', 'greenhouse', 'sea level', 'emissions', 'carbon', 'environmental', 'co2', 'ice caps', 'fossil fuel'],
  'pollution': ['pollution', 'smog', 'waste', 'plastic', 'contaminat', 'spill', 'air quality', 'water quality', 'landfill', 'toxin', 'runoff'],
  'biodiversity-loss': ['biodiversity', 'deforestation', 'extinction', 'habitat', 'ecosystem', 'species loss', 'poaching', 'overfishing'],
  'resource-scarcity': ['scarcity', 'water', 'minerals', 'oil', 'shortage', 'depletion', 'drought'],
  'poverty-hunger': ['poverty', 'hunger', 'famine', 'malnutrition', 'starvation', 'food security', 'homelessness'],
  'inequality': ['inequality', 'disparity', 'discrimination', 'justice', 'fairness', 'social gap', 'racism', 'sexism', 'wage gap'],
  'public-health': ['health', 'disease', 'pandemic', 'healthcare', 'virus', 'vaccine', 'medical', 'mental health'],
  'education-access': ['education', 'school', 'literacy', 'learning', 'tuition', 'student debt'],
  'war-conflict': ['war', 'conflict', 'violence', 'unrest', 'battle', 'invasion', 'geopolitical', 'terrorism'],
  'human-rights': ['human rights', 'slavery', 'trafficking', 'persecution', 'freedom', 'genocide', 'asylum', 'refugee'],
  'corruption-instability': ['corruption', 'graft', 'instability', 'bribery', 'coup', 'political'],
  'misinformation': ['misinformation', 'propaganda', 'fake news', 'disinformation', 'conspiracy', 'autism', 'vaccine'],
  'ai-ethics': ['ai', 'artificial intelligence', 'ethics', 'bias', 'algorithmic', 'machine learning', 'surveillance'],
  'cybersecurity': ['cybersecurity', 'hacking', 'malware', 'phishing', 'data breach', 'ransomware'],
  'digital-divide': ['digital divide', 'internet access', 'connectivity', 'broadband'],
  'automation-jobs': ['automation', 'job displacement', 'robots', 'workforce', 'unemployment'],
  'organized-crime': ['organized crime', 'mafia', 'cartel', 'gang', 'trafficking'],
  'violent-crime': ['violent crime', 'assault', 'homicide', 'murder', 'terrorism', 'shooting'],
  'property-crime': ['property crime', 'theft', 'burglary', 'vandalism', 'looting'],
  'cybercrime': ['cybercrime', 'scam', 'fraud', 'online harassment', 'identity theft'],
};

// This function finds the best category for a given title
function getCategory(title: string): string {
  if (!title) return null;
  const lowerCaseTitle = title.toLowerCase();

  for (const category in categories) {
    if (categories[category].some(keyword => lowerCaseTitle.includes(keyword))) {
      return category;
    }
  }
  return null;
}

// This is the main function that runs when the Edge Function is called
Deno.serve(async (req) => {
  try {
    // Get the single new problem record from the webhook payload
    const { record } = await req.json();
    const problemTitle = record.title;

    if (!problemTitle) {
      throw new Error('Problem title is missing from the record.');
    }

    // Determine the category for this one problem
    const category = getCategory(problemTitle);

    // If no category was found, we're done.
    if (!category) {
      return new Response(JSON.stringify({ message: 'No relevant category found.' }), {
        headers: { 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Create a Supabase client to update the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      // Use the anon key and user's authorization header from the original request
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Update only the new problem with its category
    const { error: updateError } = await supabaseClient
      .from('problems')
      .update({ category: category })
      .eq('id', record.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ message: `Categorized problem as ${category}` }), {
      headers: { 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' }, status: 400,
    });
  }
});