const runOndemandTemplateCreatorAgent = require("./agents/ondemandTemplateCreator");
const runImageGenerationAgent = require("./agents/imageGeneration");
const runPerplexityAgent = require("./agents/perplexity");
const runRedditAgent = require("./agents/reddit");

async function run() {
  const redditOutput = await runRedditAgent(
    "Research the most recent uplifting news and discoveries using reddit's r/upliftingnews to extract 3 titles."
  );

   const [imageGenerationOutput, perplexityOutput] = await Promise.all([
     runImageGenerationAgent(
       "Generate an image based on the following and shorten the URL:\n" +
         redditOutput
     ),
     runPerplexityAgent(
       "Use perplexity to augment the search for each of the following:\n" +
         redditOutput
     ),
   ]);

  const ondemandTemplateCreatorOutput = await runOndemandTemplateCreatorAgent(
    "Take the image url " +
      imageGenerationOutput +
      " and create a report for the following content using the OnDemand Template Creator and shorten the URL:\n" +
      perplexityOutput
  );

  console.log(ondemandTemplateCreatorOutput);
}

run();
