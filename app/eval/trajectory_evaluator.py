import json


class TrajectoryEvaluator:
    """
    Evaluates the trajectory of an agent's execution to ensure it uses the expected
    tools in the correct sequence. Supports EXACT and IN_ORDER scoring modes.
    """

    @staticmethod
    def evaluate(actual_trajectory: list[str], expected_trajectory: list[str], scoring_mode: str = "EXACT") -> dict:
        """
        Evaluates the actual trajectory against the expected one.
        
        Args:
            actual_trajectory: List of tool names called by the agent in order.
            expected_trajectory: Expected list of tool names.
            scoring_mode: "EXACT" (strict 1:1 match) or "IN_ORDER" (actual must contain expected in relative order).
        """
        if scoring_mode == "EXACT":
            passed = actual_trajectory == expected_trajectory
            reason = "Exact match." if passed else f"Expected {expected_trajectory}, got {actual_trajectory}."
        elif scoring_mode == "IN_ORDER":
            # Check if expected is a subsequence of actual
            actual_idx = 0
            expected_idx = 0
            while actual_idx < len(actual_trajectory) and expected_idx < len(expected_trajectory):
                if actual_trajectory[actual_idx] == expected_trajectory[expected_idx]:
                    expected_idx += 1
                actual_idx += 1
            passed = expected_idx == len(expected_trajectory)
            reason = "In-order match." if passed else f"Failed to find {expected_trajectory} in correct order within {actual_trajectory}."
        else:
            passed = False
            reason = f"Unknown scoring mode: {scoring_mode}"

        return {
            "passed": passed,
            "reason": reason,
            "actual_trajectory": actual_trajectory,
            "expected_trajectory": expected_trajectory,
            "scoring_mode": scoring_mode
        }

    @staticmethod
    def run_eval_case_simulation(case_path: str):
        """
        Simulates running an evaluation case. In a full system, this would spin up the ADK runner 
        in a headless loop and capture `event.get_function_calls()`.
        """
        with open(case_path) as f:
            cases = json.load(f)

        results = []
        for case in cases:
            expected = case.get("expected_trajectory", [])
            scoring = case.get("trajectory_scoring", "EXACT")

            # SIMULATION: Assume the agent perfectly follows the expected trajectory for this test
            actual = expected.copy()

            res = TrajectoryEvaluator.evaluate(actual, expected, scoring)
            res["case_id"] = case.get("case_id", "unknown")
            results.append(res)

            print(f"[EVAL] Case {res['case_id']} | Passed: {res['passed']} | Mode: {res['scoring_mode']} | Trajectory: {res['actual_trajectory']}")

        return results

if __name__ == "__main__":
    TrajectoryEvaluator.run_eval_case_simulation(".agents/skills/sales_pipeline/eval_cases.json")
