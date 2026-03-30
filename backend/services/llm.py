import requests
import json
import re

def analyze_log(log):
    prompt = f"""
You are a senior DevOps engineer.

Analyze this log:
{log}

IMPORTANT RULES:
- Respond ONLY in JSON
- No explanation
- No markdown
- Keep answers SHORT

Output:

{{
  "root_cause": "short sentence",
  "severity": "Low/Medium/High",
  "suggestion": "short fix"
}}
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3",
                "prompt": prompt,
                "stream": False
            }
        )

        text = response.json()["response"]
        print("🤖 RAW:", text)

        # 🔥 Remove markdown if present
        text = re.sub(r"```json|```", "", text).strip()

        # 🔥 Extract JSON using regex (BEST METHOD)
        match = re.search(r'\{.*\}', text, re.DOTALL)

        if match:
            try:
                data = json.loads(match.group())

                # ✅ Ensure keys exist
                return {
                    "root_cause": data.get("root_cause", "Unknown issue"),
                    "severity": data.get("severity", "High"),
                    "suggestion": data.get("suggestion", "Check system")
                }
            except:
                pass

        # ✅ fallback if parsing fails
        return {
            "root_cause": "High resource usage detected",
            "severity": "High",
            "suggestion": "Scale system or restart services"
        }

    except Exception as e:
        print("❌ LLM ERROR:", e)
        return {
            "root_cause": "LLM failure",
            "severity": "High",
            "suggestion": "Check AI service"
        }