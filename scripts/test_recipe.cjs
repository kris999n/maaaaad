const axios = require('axios');
const cheerio = require('cheerio');

async function testValdemarsro() {
  const url = 'https://www.valdemarsro.dk/dhal/';
  console.log(`Fetching ${url}...`);
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,da;q=0.8'
      }
    });
    console.log('Response Status:', res.status);
    console.log('Response Headers:', Object.keys(res.headers));
    console.log('Final URL:', res.request.res.responseUrl || res.request.path);
    console.log('HTML Length:', res.data.length);
    console.log('HTML Snippet:', res.data.substring(0, 1000));
    
    const $ = cheerio.load(res.data);
    
    console.log('--- JSON-LD Scripts ---');
    $('script[type="application/ld+json"]').each((i, el) => {
      const text = $(el).text();
      console.log(`Script ${i}: length ${text.length}`);
      try {
        const parsed = JSON.parse(text);
        if (parsed['@graph']) {
          console.log('Graph Types:', parsed['@graph'].map(n => n['@type']));
          // Log keys of the article node
          const article = parsed['@graph'].find(n => n['@type'] === 'Article');
          if (article) {
            console.log('Article keys:', Object.keys(article));
          }
        }
      } catch (e) {
        console.error('JSON parse error:', e.message);
      }
    });

    console.log('--- HTML Selectors ---');
    console.log('Title:', $('h1').first().text().trim());

    console.log('--- Ingredients ---');
    $('ul.ingredientlist li, .ingredientlist li').each((i, el) => {
      console.log(`  Ing ${i}: "${$(el).text().trim()}"`);
    });

    console.log('--- Recipe Stats ---');
    $('.recipe-stat').each((i, el) => {
      console.log(`  Stat ${i}: label="${$(el).find('span').text().trim()}", value="${$(el).find('strong').text().trim()}"`);
    });
    
    console.log('--- Recipe Stats alternate (recipe-print-header-content-info-column) ---');
    $('.recipe-print-header-content-info-column').each((i, el) => {
      console.log(`  Header Col ${i}: "${$(el).text().trim().replace(/\s+/g, ' ')}"`);
    });

    console.log('--- Instructions (Fremgangsmåde) ---');
    // Let's print the child elements of .post-recipe to understand where steps are
    if ($('.post-recipe').length > 0) {
      console.log('post-recipe element exists. Printing its paragraph contents and headers:');
      $('.post-recipe').find('h2, h3, p, ol, ul').each((i, el) => {
        const tagName = el.tagName.toLowerCase();
        const className = $(el).attr('class') || '';
        const text = $(el).text().trim();
        if (text) {
          console.log(`  [${tagName} class="${className}"]: "${text.substring(0, 150)}..."`);
        }
      });
    } else {
      console.log('post-recipe element does not exist.');
    }

    console.log('--- Image URLs ---');
    console.log('Printing all img tags inside .recipe-image or .post-recipe:');
    $('.recipe-image img, .post-recipe img, img.recipe-image').each((i, el) => {
      console.log(`  Img ${i} attributes:`);
      const attrs = el.attribs;
      for (const attr in attrs) {
        console.log(`    ${attr} = "${attrs[attr]}"`);
      }
    });

    console.log('--- Extra Description / Info ---');
    // The description is usually the first paragraph or meta description
    console.log('Meta Description:', $('meta[name="description"]').attr('content'));
    console.log('First p text:', $('p').first().text().trim().substring(0, 200) + '...');
  } catch (err) {
    console.error('Error fetching Valdemarsro:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Headers:', err.response.headers);
      console.error('Data Snippet:', String(err.response.data).substring(0, 1000));
    }
  }
}

async function testArla() {
  const url = 'https://www.arla.dk/opskrifter/boller-i-karry/';
  console.log(`\nFetching Arla: ${url}...`);
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Response Status:', res.status);
    console.log('Final URL:', res.request.res.responseUrl || res.request.path);
    console.log('HTML Length:', res.data.length);
    
    const $ = cheerio.load(res.data);
    console.log('Title:', $('h1').first().text().trim());

    // Search JSON-LD
    console.log('--- Arla JSON-LD Scripts ---');
    $('script[type="application/ld+json"]').each((i, el) => {
      const text = $(el).text();
      if (text.includes('"Recipe"') || text.includes('"recipeIngredient"')) {
        console.log(`Script ${i} length ${text.length} matches Recipe!`);
        try {
          const parsed = JSON.parse(text);
          // Arla might have direct Recipe or in a list
          const recipeNode = Array.isArray(parsed) ? parsed.find(n => n['@type'] === 'Recipe') : (parsed['@type'] === 'Recipe' ? parsed : null);
          if (recipeNode) {
            console.log('  -> SUCCESS! Found Recipe Node!');
            console.log('  Details:', {
              name: recipeNode.name,
              prepTime: recipeNode.prepTime,
              cookTime: recipeNode.cookTime,
              recipeYield: recipeNode.recipeYield,
              image: recipeNode.image, // Log image field
              ingredientCount: recipeNode.recipeIngredient ? recipeNode.recipeIngredient.length : 0,
              instructionCount: recipeNode.recipeInstructions ? recipeNode.recipeInstructions.length : 0
            });
            if (recipeNode.recipeIngredient) console.log('  First 3 Ingredients:', recipeNode.recipeIngredient.slice(0, 3));
          } else {
            console.log('  Could not find Recipe type in parsed JSON.');
          }
        } catch (e) {
          console.log('  JSON parse failed:', e.message);
        }
      }
    });

    console.log('--- Arla HTML Selectors ---');
    console.log('All list elements for ingredients (checking classes):');
    $('ul, ol').each((i, el) => {
      const className = $(el).attr('class') || '';
      if (className.includes('ingredient') || className.includes('recipe-list')) {
        console.log(`  <${el.tagName} class="${className}">: "${$(el).text().substring(0, 150).trim().replace(/\s+/g, ' ')}"`);
      }
    });

    console.log('All image elements:');
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      const className = $(el).attr('class') || '';
      if (src.includes('opskrifter') || className.includes('hero') || className.includes('recipe')) {
        console.log(`  Img: src="${src}", class="${className}"`);
      }
    });

  } catch (err) {
    console.error('Error fetching Arla:', err.message);
  }
}

testArla();
