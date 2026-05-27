# NumPal Modular Workspace

This repository has been restructured to facilitate modular development, isolated environments, and automated deployments for both the GitHub Pages frontend and the Google Apps Script backend.

## Architecture & Folder Structure

- `frontend/`: Contains all client-side code.
  - `css/`: Stylesheets.
  - `pages/`: HTML views for the application.
  - `js/`: Modular JavaScript logic.
    - `core/`: Core initialization and configurations (`config.js`, `app.js`).
    - `utils/`: Shared utilities (`ui.js`, `rolodex.js`).
    - `pages/`: Page-specific scripts, directly mapping to HTML views.
- `backend/`: Contains Google Apps Script backend logic.
- `assets/`: Contains images and application icons.
- `.github/workflows/`: Contains GitHub Actions for continuous deployment.

## Environment Management

You can toggle between the 3 environments (Exp, Dev, Prod) by altering the `ENV` constant inside `frontend/js/core/config.js`. 
- **Dev**: Displays a persistent red `Testing` banner.
- **Exp**: Displays a persistent purple `Experimentation` banner.
- **Prod**: Operates normally with no banner.

## Automated Backend Deployment (Google Apps Script)

This repository includes a GitHub Action to automatically deploy changes made in the `backend/` folder directly to Google Apps Script using `clasp`. This workflow will push the code and **update your existing Web App URL** seamlessly, without needing a hardcoded `.clasp.json` file in the repo.

### Setup Instructions via GitHub Codespaces:

**Part 1: Authenticate and link Clasp**
1. Navigate to your repository on GitHub.
2. Click the green **Code** button, switch to the **Codespaces** tab, and click **Create codespace on main**.
3. Once the web editor loads, open the terminal (View > Terminal).
4. Install clasp globally in your codespace: `npm install -g @google/clasp`
5. Run the authentication command: `clasp login --no-localhost`
6. Clasp will provide a URL in the terminal. Open that URL in a new browser tab, log in with your Google account, and grant permissions.
7. You will be given an authorization code. Copy it, paste it back into your Codespaces terminal, and press Enter. This generates your credentials.

**Part 2: Retrieve your existing Deployment ID**
1. You must have deployed your Google Apps Script as a Web App at least once (via the Apps Script Editor: Deploy > New Deployment > Web App).
2. Inside your Codespaces terminal, temporarily link to your Apps Script project by running: `cd backend && clasp clone <SCRIPT_ID>` *(Note: `.clasp.json` is ignored by git so it won't be committed).*
3. Run the command: `clasp deployments`
4. You will see a list of deployments. Look for the one associated with your active Web App. It will look something like this:
   `- AKfycb... @1 - web app meta-version`
5. Copy the deployment ID string (e.g., `AKfycbwECIelwQpWq-bVniCpHgLqQlBGA0lGzPsN--4xBVoGQUbJsQT18b6zi8F00UMV2mpG`).

**Part 3: Add GitHub Secrets**
Go to your GitHub repository **Settings > Secrets and variables > Actions** and add the following 3 Repository Secrets:
1. `GAS_SCRIPT_ID`: Paste your Apps Script Project ID here.
2. `GAS_DEPLOYMENT_ID`: Paste the Deployment ID you copied in Part 2 here.
3. `CLASP_CREDENTIALS`: Paste your credential JSON object here. *(Note: The workflow is explicitly built to parse custom dictionary formats containing `tokens.default` as well as native `.clasprc.json` formats).*

Future commits to the `main` branch that modify files in the `backend/` directory will now trigger the workflow, dynamically create the `.clasp.json` configuration, push the code, and publish a new version without changing your Web App URL.