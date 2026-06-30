import json
import os


class TraceMiner:
    """
    Online Evaluation & Trace Clustering.
    Mines user corrections from failed_traces.jsonl and uses Gemini to holistically
    cluster them, identifying systemic tool misuse or missing agent skills.
    """

    @staticmethod
    def cluster_failures(trace_file: str = "failed_traces.jsonl"):
        if not os.path.exists(trace_file):
            print("No failed traces found.")
            return

        with open(trace_file, encoding="utf-8") as f:
            lines = f.readlines()

        traces = [json.loads(line) for line in lines if line.strip()]
        if not traces:
            print("No traces to cluster.")
            return

        # Extract user corrections and trajectories
        corrections = []
        for t in traces:
            correction = t.get("user_correction", "Unknown")
            tools_used = [
                step["name"]
                for step in t.get("trace", [])
                if step.get("type") == "tool_call"
            ]
            corrections.append(
                f"User Correction: '{correction}' | Tools Used: {tools_used}"
            )

        prompt = (
            "You are a Senior AI Architect evaluating failed agent interactions.\n"
            "Here is a list of user corrections and the tools the agent tried to use before failing:\n"
            + "\n".join([f"- {c}" for c in corrections])
            + "\n\nPlease cluster these failures into 1-3 distinct systemic failure modes or missing skills. "
            "Respond with a markdown summary of the clusters, and recommend what new skills should be built to resolve them."
        )

        try:
            from google.genai import Client

            client = Client()
            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=prompt
            )
            print("=== TRACE CLUSTERING REPORT ===")
            print(response.text)
            print("===============================")
        except Exception as e:
            print(f"Error during trace clustering: {e}")


if __name__ == "__main__":
    TraceMiner.cluster_failures()
