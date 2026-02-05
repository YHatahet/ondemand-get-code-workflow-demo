import asyncio
from agents import reddit, image_generation, perplexity, ondemand_template_creator


async def main():
    # 1. Run Reddit Agent (Sequential)

    print("--- 1. Running Reddit Agent ---")
    reddit_query = "Research the most recent uplifting news and discoveries using reddit's r/upliftingnews to extract 3 titles."
    
    reddit_output = await reddit.run(reddit_query)

    print("Reddit Output:", reddit_output)

    # Safely extract answer
    reddit_answer = reddit_output.get("data", {}).get("answer", "")

    # 2. Run Image Gen and Perplexity (Parallel)
    print("\n--- 2. Running Image Gen & Perplexity (Parallel) ---")

    image_query = (
        "Generate an image based on the following and shorten the URL using the short.io tool:\n"
        + reddit_answer
    )

    perplexity_query = (
        "Use perplexity to augment the search for each of the following:\n"
        + reddit_answer
    )

    # asyncio.gather runs these concurrently, like Promise.all
    image_gen_output, perplexity_output = await asyncio.gather(
        image_generation.run(image_query), perplexity.run(perplexity_query)
    )

    print("Image Gen Output:", image_gen_output)
    print("\nPerplexity Output:", perplexity_output)

    # Extract answers
    image_url = image_gen_output.get("data", {}).get("answer", "")
    perplexity_content = perplexity_output.get("data", {}).get("answer", "")

    # 3. Run OnDemand Template Creator (Sequential)
    print("\n--- 3. Running Template Creator ---")

    template_query = (
        "Take the image url "
        + image_url
        + " and create a report for the following content using the OnDemand Template Creator tool. "
        "Then, shorten the URL using short.io tool. Return only the PDF URL:\n"
        + perplexity_content
    )

    ondemand_output = await ondemand_template_creator.run(template_query)
    print("Final Output:", ondemand_output)


if __name__ == "__main__":
    asyncio.run(main())
