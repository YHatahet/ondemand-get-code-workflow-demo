const runOndemandTemplateCreatorAgent = require("./agents/ondemandTemplateCreator");
const runImageGenerationAgent = require("./agents/imageGeneration");
const runPerplexityAgent = require("./agents/perplexity");
const runRedditAgent = require("./agents/reddit");

async function run() {
  const redditOutput = await runRedditAgent(
    "Research the most recent uplifting news and discoveries using reddit's r/upliftingnews to extract 3 titles."
  );
  console.log(redditOutput);

  const [imageGenerationOutput, perplexityOutput] = await Promise.all([
    runImageGenerationAgent(
      "Generate an image based on the following and shorten the URL using the short.io tool:\n" +
      redditOutput?.data?.answer
    ),
    runPerplexityAgent(
      "Use perplexity to augment the search for each of the following:\n" +
      redditOutput?.data?.answer
    ),
  ]);
  console.log(imageGenerationOutput);
  console.log(perplexityOutput);


  const ondemandTemplateCreatorOutput = await runOndemandTemplateCreatorAgent(
    "Take the image url " +
    imageGenerationOutput?.data?.answer +
    " and create a report for the following content using the OnDemand Template Creator tool. Then, shorten the URL using short.io tool. Return only the PDF URL:\n" +
    perplexityOutput?.data?.answer
  );
  console.log(ondemandTemplateCreatorOutput)
}

run();
