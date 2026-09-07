"""
DataSense AI - Dev Harness: Unified Command Line Interface (CLI)
Allows running benchmarks, adversarial stress tests, and generating the benchmark scorecard.

Usage:
  python dev-harness/cli.py --all
  python dev-harness/cli.py --benchmark
  python dev-harness/cli.py --stress-test
  python dev-harness/cli.py --export
"""

import sys
import argparse
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DEV_HARNESS_DIR = Path(__file__).resolve().parent

for p in [str(ROOT_DIR), str(DEV_HARNESS_DIR), str(ROOT_DIR / "harness"), str(ROOT_DIR / "core-ml"), str(ROOT_DIR / "backend")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from benchmark_evaluator import BenchmarkEvaluator
from adversarial_tester import AdversarialTester
from scorecard_generator import ScorecardGenerator


def main():
    parser = argparse.ArgumentParser(
        description="DataSense AI Dev Harness CLI - Multi-Agent Benchmark & Evaluation Suite"
    )
    parser.add_argument("--all", action="store_true", help="Run benchmarks, stress-tests, and update scorecard")
    parser.add_argument("--benchmark", action="store_true", help="Run multi-domain benchmark evaluation suite")
    parser.add_argument("--stress-test", action="store_true", help="Run adversarial stress testing suite")
    parser.add_argument("--export", action="store_true", help="Generate BENCHMARK_SCORECARD.md")
    parser.add_argument("--json", action="store_true", help="Output raw JSON results")

    args = parser.parse_args()

    # Default to --all if no specific flag is provided
    if not (args.all or args.benchmark or args.stress_test or args.export):
        args.all = True

    generator = ScorecardGenerator()

    if args.all or args.export:
        print("=" * 70)
        print("🚀 DATASENSE AI DEV HARNESS: RUNNING FULL EVALUATION SUITE")
        print("=" * 70)
        scorecard = generator.generate_full_scorecard()
        md_path = generator.write_scorecard()

        if args.json:
            print(json.dumps(scorecard, indent=2))
        else:
            bm = scorecard["benchmark_summary"]
            st = scorecard["stress_summary"]
            print(f"\n✅ Benchmark Suite Completed:")
            print(f"   • Datasets Tested: {bm['passed_datasets']}/{bm['total_datasets_tested']}")
            print(f"   • Avg Schema Precision: {bm['avg_schema_precision']}%")
            print(f"   • Avg Fact Check Accuracy: {bm['avg_fact_check_accuracy']}%")
            print(f"   • Hallucination Rate: {bm['avg_hallucination_rate']}%")
            print(f"   • Overall Latency: {bm['overall_duration_seconds']}s")

            print(f"\n✅ Stress-Testing Suite Completed:")
            print(f"   • Tests Passed: {st['passed_stress_tests']}/{st['total_stress_tests']} ({st['pass_rate']}%)")

            print(f"\n📄 Markdown Scorecard Saved:")
            print(f"   • {md_path}")
            print("=" * 70)
        return

    if args.benchmark:
        print("Running Multi-Domain Benchmark Suite...")
        evaluator = BenchmarkEvaluator()
        res = evaluator.run_all_benchmarks()
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"Completed {res['passed_datasets']}/{res['total_datasets_tested']} benchmarks in {res['overall_duration_seconds']}s")
            for b in res["benchmarks"]:
                status = "✅ PASS" if b.get("status") == "passed" else "❌ FAIL"
                print(f" - {b['name']}: {status} (Health: {b.get('health_score', 0)}%, Verified: {b.get('verified_insights_count', 0)}/{b.get('total_insights_generated', 0)})")

    if args.stress_test:
        print("Running Adversarial Stress-Testing Suite...")
        tester = AdversarialTester()
        res = tester.run_all_stress_tests()
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"Completed {res['passed_stress_tests']}/{res['total_stress_tests']} stress tests ({res['pass_rate']}%)")
            for t in res["tests"]:
                status = "✅ PASS" if t.get("status") == "passed" else "❌ FAIL"
                print(f" - {t['name']}: {status} (Actions: {t.get('cleaning_actions', 0)})")


if __name__ == "__main__":
    main()
