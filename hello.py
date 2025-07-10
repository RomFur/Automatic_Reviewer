from langchain_community.llms import Ollama

# 1. Load the text file
with open("input.txt", "r", encoding="utf-8") as f:
    file_text = f.read()

# 2. Initialize the LLM
llm = Ollama(model="llama3")

# 3. Create a summarization prompt
prompt = f"Please summarize the following text into 10 sentences:\n\n{file_text}"

# 4. Get summary
summary = llm.invoke(prompt)

# 5. Print result
print("Summary:\n", summary)