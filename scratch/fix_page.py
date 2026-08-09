import sys

file_path = "/Users/amansharma/Desktop/blastup/client/src/app/(dashboard)/chatbot/page.tsx"
with open(file_path, "r") as f:
    lines = f.readlines()

# 1. Remove DOMAINS TAB
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "══════════════════════════════════════════ DOMAINS TAB ══" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx + 1, len(lines)):
        if "══════════════════════════════════════════ PREVIEW TAB ══" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + lines[end_idx:]

with open(file_path, "w") as f:
    f.writelines(lines)
print("DOMAINS TAB removed")
