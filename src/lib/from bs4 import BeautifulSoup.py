from bs4 import BeautifulSoup

# Load your HTML file
with open("instruments.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "lxml")  # lxml parser is faster

# Extract all text inside <a> tags
instruments = [a.get_text(strip=True) for a in soup.find_all("a")]

# Remove duplicates and sort
instruments = sorted(set(instruments))

# Save to a plain text file
with open("instruments.txt", "w", encoding="utf-8") as f:
    for instr in instruments:
        f.write(instr + "\n")

print(f"Saved {len(instruments)} instruments to instruments.txt")
