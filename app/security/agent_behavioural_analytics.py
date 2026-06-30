from collections import defaultdict
from time import time


class AgentBehaviouralAnalytics:
    """
    ABA Engine: Monitors the active Agent Bill of Materials (AgBOM).
    Detects abnormal spikes in tool invocation (e.g., prompt injection or runaway hallucination loops).
    """

    def __init__(self, time_window_seconds: int = 60, max_calls: int = 20):
        self.time_window_seconds = time_window_seconds
        self.max_calls = max_calls
        # Maps session_id -> list of timestamps of tool calls
        self.session_tool_calls: dict[str, list[float]] = defaultdict(list)
        # Set of quarantined session IDs
        self.quarantined_sessions: set[str] = set()

    def record_tool_call(self, session_id: str, tool_name: str) -> bool:
        """
        Records a tool call.
        Returns True if the session has violated the threshold and should be quarantined.
        """
        if session_id in self.quarantined_sessions:
            return True

        current_time = time()
        calls = self.session_tool_calls[session_id]

        # Prune calls outside the sliding window
        calls = [t for t in calls if current_time - t <= self.time_window_seconds]
        calls.append(current_time)
        self.session_tool_calls[session_id] = calls

        # Trigger quarantine if threshold exceeded
        if len(calls) > self.max_calls:
            self.quarantined_sessions.add(session_id)
            return True

        return False


# Global ABA instance with a strict threshold for demonstration
aba_engine = AgentBehaviouralAnalytics(time_window_seconds=60, max_calls=15)
