import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)

PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama3-8b-8192"  # use if rate-limited


async def stream_chat(messages: list[dict]):
    stream = await client.chat.completions.create(
        model=PRIMARY_MODEL,
        messages=messages,
        stream=True,
        max_tokens=1500,
        temperature=0.3,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def complete(messages: list[dict], max_tokens: int = 500) -> str:
    response = await client.chat.completions.create(
        model=PRIMARY_MODEL,
        messages=messages,
        stream=False,
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""
