# Contributing to Android Privacy Auditor

Thank you for contributing to **Android Privacy Auditor**! We welcome improvements to the static analyzer, signature database, permission mapping, and Next.js interface.

---

## Code of Conduct

Please maintain an inclusive, constructive, and respectful environment for all contributors.

---

## Development Workflow

1. **Fork the Repository**: Fork on GitHub and clone locally:
   ```bash
   git clone https://github.com/<your-username>/privacy-auditor.git
   cd privacy-auditor
   ```
2. **Backend Setup (`analyzer/`)**:
   ```bash
   cd analyzer
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   PYTHONPATH=. pytest -v
   ```
3. **Frontend Setup (`web/`)**:
   ```bash
   cd ../web
   npm install
   npm run build
   ```
4. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Verify Tests**: Ensure both backend `pytest` and frontend Next.js builds pass before opening a PR.
6. **Submit a Pull Request**: Push your branch and open a PR against `main`.

---

## Responsible Security Disclosure

To report a vulnerability or sensitive finding, please email **business.scempyy@outlook.com**.
