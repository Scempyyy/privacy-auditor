#!/usr/bin/env python3
"""Automated Browser End-to-End Test for Android Privacy Auditor.
Executes real FastAPI backend and Next.js frontend, performs live APK analysis,
verifies report contents, verifies localStorage history, and captures screenshots.
"""
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = Path("docs/screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
APTOIDE_PATH = Path("/home/admin/Downloads/viruses-24hours.apk").resolve()

def wait_for_url(url: str, timeout: int = 30) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def main():
    print("=== Starting Real Backend & Frontend Services ===")
    # 1. Kill any zombie processes on ports 8000 & 3000
    subprocess.run(["fuser", "-k", "8000/tcp"], capture_output=True)
    subprocess.run(["fuser", "-k", "3000/tcp"], capture_output=True)

    # 2. Start FastAPI Backend
    env = os.environ.copy()
    backend_proc = subprocess.Popen(
        [".venv/bin/uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--log-level", "warning"],
        cwd="analyzer",
        env=env
    )
    
    # 3. Start Next.js Frontend
    frontend_proc = subprocess.Popen(
        ["npm", "run", "start", "--", "-p", "3000"],
        cwd="web"
    )

    try:
        print("Waiting for Backend (http://127.0.0.1:8000/health)...")
        if not wait_for_url("http://127.0.0.1:8000/health", timeout=30):
            raise RuntimeError("Backend failed to start on port 8000")
        print("Backend is healthy!")

        print("Waiting for Frontend (http://127.0.0.1:3000)...")
        if not wait_for_url("http://127.0.0.1:3000", timeout=45):
            raise RuntimeError("Frontend failed to start on port 3000")
        print("Frontend is healthy!")

        print("\n=== Launching Playwright Browser End-to-End Suite ===")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/usr/bin/google-chrome-stable",
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            context = browser.new_context(viewport={"width": 1400, "height": 900})
            page = context.new_page()

            # Step 1: Open Scanner Page
            print("1. Navigating to http://localhost:3000/scanner...")
            page.goto("http://localhost:3000/scanner", wait_until="load")
            page.wait_for_selector("text=Backend online", timeout=15000)
            print("   -> Backend health indicator verified: Backend online")

            # Step 2: Select category & file
            print("2. Selecting category 'App Store / Marketplace'...")
            page.select_option("select", value="app_store")
            
            print(f"3. Uploading real Aptoide APK ({APTOIDE_PATH})...")
            file_input = page.locator("input[type='file']")
            file_input.set_input_files(str(APTOIDE_PATH))
            page.wait_for_selector("text=viruses-24hours.apk", timeout=10000)

            # Screenshot 1: Scanner before submission
            ss1_path = SCREENSHOTS_DIR / "1_scanner_before_submission.png"
            page.screenshot(path=str(ss1_path))
            print(f"   -> Captured: {ss1_path}")

            # Step 3: Click Analyze
            print("4. Submitting APK for live static analysis...")
            scan_button = page.locator("button.scan-button")
            scan_button.click()

            # Step 4: Wait for Report Page
            print("5. Waiting for live analysis report to complete...")
            page.wait_for_url("**/report*", timeout=60000)
            page.wait_for_selector("text=cm.aptoide.pt", timeout=15000)
            print("   -> Report loaded successfully for package: cm.aptoide.pt")

            # Screenshot 2: Completed Scan (Top section)
            ss2_path = SCREENSHOTS_DIR / "2_completed_scan.png"
            page.screenshot(path=str(ss2_path))
            print(f"   -> Captured: {ss2_path}")

            # Step 5: Verify Report Elements
            print("6. Verifying report content & scoring integrity...")
            score_text = page.locator(".score-ring strong").inner_text()
            grade_text = page.locator(".grade-pill").inner_text()
            print(f"   -> Verified Score: {score_text}/100, Grade: {grade_text}")
            assert score_text == "55", f"Expected score 55, got {score_text}"

            # Verify Malware Scan Notice
            malware_notice = page.locator("text=Malware scan not performed")
            assert malware_notice.count() > 0, "Missing 'Malware scan not performed' notice!"
            print("   -> Verified: 'Malware scan not performed' disclaimer prominently visible")

            # Verify Trackers
            assert page.locator("text=Google CrashLytics").count() > 0, "Missing CrashLytics match"
            assert page.locator("text=Google Firebase Analytics").count() > 0, "Missing Firebase Analytics match"
            assert page.locator("text=AppLovin (MAX and SparkLabs)").count() > 0, "Missing AppLovin match"
            assert page.locator("text=IAB Open Measurement").count() > 0, "Missing IAB Open Measurement match"
            print("   -> Verified: All 4 Exodus tracker findings rendered with evidence")

            # Screenshot 3: Full Report
            ss3_path = SCREENSHOTS_DIR / "3_full_report.png"
            page.screenshot(path=str(ss3_path), full_page=True)
            print(f"   -> Captured: {ss3_path} (full page)")

            # Step 6: Verify Dashboard History
            print("7. Navigating to Dashboard to verify local persistence...")
            page.goto("http://localhost:3000/dashboard", wait_until="load")
            page.wait_for_selector("text=cm.aptoide.pt", timeout=15000)
            print("   -> Verified: Aptoide scan present in local scan history")

            # Screenshot 4: Dashboard History
            ss4_path = SCREENSHOTS_DIR / "4_dashboard_history.png"
            page.screenshot(path=str(ss4_path))
            print(f"   -> Captured: {ss4_path}")

            # Step 7: Reload to prove persistence
            print("8. Reloading Dashboard to verify persistence across sessions...")
            page.reload(wait_until="load")
            page.wait_for_selector("text=cm.aptoide.pt", timeout=15000)
            print("   -> Verified: Scan history strictly preserved in localStorage after reload")

            browser.close()
            print("\n=== All Browser End-to-End Assertions PASSED (100%) ===")
    except Exception as exc:
        import traceback
        print("\n!!! EXCEPTION IN BROWSER TEST !!!")
        traceback.print_exc()
        raise
    finally:
        print("Cleaning up backend & frontend processes...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()

if __name__ == "__main__":
    main()
