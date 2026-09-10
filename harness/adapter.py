"""
FastAPI Integration Adapter: High-level bridge connecting the DeepSeek Harness runtime to backend HTTP & SSE endpoints.
"""

import json
import queue
import threading
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator, Generator
from .workflows.investigation_pipeline import run_investigation_pipeline
from .workflows.deep_dive import run_deep_dive_investigation
from .agents.query_assistant import answer_dataset_question


def run_investigation_sync(
    file_path: str,
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Synchronously executes the full multi-agent investigation."""
    return run_investigation_pipeline(file_path=file_path, options=options)


async def run_investigation_async(
    file_path: str,
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Asynchronously runs the investigation offloaded to a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, run_investigation_pipeline, file_path, None, options)


def stream_investigation_events_sync(
    file_path: str,
    options: Optional[Dict[str, Any]] = None
) -> Generator[str, None, None]:
    """
    Synchronous generator yielding Server-Sent Events (SSE) formatted strings:
    'data: {"type": "event"|"result", ...}\n\n'
    """
    event_q: queue.Queue = queue.Queue()
    result_holder = {}

    def event_cb(ev: Dict[str, Any]):
        event_q.put(("event", ev))

    def worker():
        try:
            res = run_investigation_pipeline(file_path=file_path, event_callback=event_cb, options=options)
            result_holder["res"] = res
        except Exception as e:
            result_holder["error"] = str(e)
        finally:
            event_q.put(("done", None))

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    while True:
        try:
            kind, payload = event_q.get(timeout=30)
            if kind == "event":
                yield f"data: {json.dumps({'type': 'event', 'data': payload}, default=str)}\n\n"
            elif kind == "done":
                if "res" in result_holder:
                    yield f"data: {json.dumps({'type': 'complete', 'data': result_holder['res']}, default=str)}\n\n"
                else:
                    err_msg = result_holder.get("error", "Investigation failed.")
                    yield f"data: {json.dumps({'type': 'error', 'message': err_msg}, default=str)}\n\n"
                break
        except queue.Empty:
            # Keepalive ping
            yield ": keepalive\n\n"


async def stream_investigation_events_async(
    file_path: str,
    options: Optional[Dict[str, Any]] = None
) -> AsyncGenerator[str, None]:
    """
    Asynchronous generator for FastAPI StreamingResponse:
    Yields real-time SSE chunks as agents complete each step.
    """
    loop = asyncio.get_event_loop()
    sync_gen = stream_investigation_events_sync(file_path, options)

    def next_chunk():
        try:
            return next(sync_gen)
        except StopIteration:
            return None

    while True:
        chunk = await loop.run_in_executor(None, next_chunk)
        if chunk is None:
            break
        yield chunk


def drilldown_finding(
    dataset_path: str,
    finding_type: str,
    target_id: Optional[Any] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Helper for 'Investigate This Finding' drilldown."""
    return run_deep_dive_investigation(
        dataset_path=dataset_path,
        finding_type=finding_type,
        target_id=target_id,
        context=context
    )


def query_dataset(
    dataset_path: str,
    question: str
) -> Dict[str, Any]:
    """Helper for 'Ask Dataset' question answering."""
    return answer_dataset_question(
        dataset_path=dataset_path,
        question=question
    )
