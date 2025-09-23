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

Deno.serve(async (req) => {
  try {
    // This function needs admin rights to update all rows, so we use the SERVICE_ROLE_KEY
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Fetch all problems that do not have a category yet
    const { data: problems, error: fetchError } = await supabaseClient
      .from('problems')
      .select('id, title')
      .is('category', null);

    if (fetchError) throw fetchError;

    let updatedCount = 0;
    console.log(`Found ${problems.length} problems to categorize.`);

    // 2. Loop through each uncategorized problem
    for (const problem of problems) {
      const category = getCategory(problem.title);
      if (category) {
        // 3. Update the problem with its new category
        console.log(`Categorizing "${problem.title}" as "${category}"`);
        await supabaseClient
          .from('problems')
          .update({ category: category })
          .eq('id', problem.id);
        
        updatedCount++;
      } else {
        console.log(`No category match for "${problem.title}"`);
      }
    }

    return new Response(JSON.stringify({ message: `Successfully categorized ${updatedCount} of ${problems.length} problems.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});