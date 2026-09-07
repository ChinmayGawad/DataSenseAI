"""
Base Agent Utilities: Prompt assembly, structured LLM communication, and robust fallback handlers.
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
try:
    from harness.config import default_config
except ImportError:
    from ..config import default_config


def call_llm(
    prompt: str,
    system_prompt: str = "You are an expert AI data analyst.",
    json_mode: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Sends a structured prompt to DeepSeek or compatible OpenAI-compatible LLM endpoint.
    Returns parsed JSON dictionary or None if LLM is unavailable.
    """
    if not default_config.api_key:
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {default_config.api_key}"
    }

    payload = {
        "model": default_config.model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": default_config.temperature,
        "max_tokens": default_config.max_tokens,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        req = urllib.request.Request(
            f"{default_config.api_base}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception:
        # Graceful fallback to heuristic agents
        return None
