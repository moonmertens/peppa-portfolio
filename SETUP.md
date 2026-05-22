# Setup Guide

This guide has two parts:

- **Part 1** is for the developer — the person who clones the repo, sets up accounts, and deploys the site.
- **Part 2** is for the artist — the person who will use the Studio to manage her portfolio content day to day. It is written in plain language with no assumed technical knowledge.

---

## Part 1: Developer Setup

### Prerequisites

Before you start, make sure you have the following installed and ready:

- **Node.js 18 or newer** — check with `node -v` in your terminal
- **npm** — comes with Node.js
- **git** — check with `git --version`
- A **GitHub account** — needed for Vercel to pull your code
- A **Vercel account** — free at [vercel.com](https://vercel.com)
- A **Sanity account** — free at [sanity.io](https://sanity.io)

---

### Step 1: Push to GitHub

Vercel deploys by pulling code directly from a GitHub repository. You need to do this before setting up Vercel.

1. Go to [github.com](https://github.com) and create a new repository. Name it whatever you like (e.g., `portfolio`). Set it to private if preferred.
2. In your terminal, from the project root, run:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

The code is now on GitHub and ready for Vercel to pick up.

---

### Step 2: Create a Sanity Project

The site uses Sanity as its content management backend. You need a free project to connect to.

1. Go to [sanity.io/manage](https://sanity.io/manage) and log in (or create a free account).
2. Click **"Create new project"**.
3. Give it a name (e.g., the artist's name).
4. When prompted for a dataset, name it **`production`** — the code expects this exact name.
5. Once the project is created, find the **Project ID** on the project dashboard. It looks like `abc12345`. Copy it — you will need it in the next step.

**Add CORS origins** (important — the Studio will not load without this):

1. In the Sanity project dashboard, go to **API** in the left sidebar.
2. Under **CORS Origins**, click **Add CORS Origin**.
3. Add `http://localhost:3000` with **"Allow credentials"** checked.
4. Click **Save**.

You will come back to add the production Vercel URL after you deploy in Step 6.

---

### Step 3: Get a Web3Forms Access Key

The contact form sends messages through Web3Forms without exposing the artist's email address. No account is required — just an email address.

1. Go to [web3forms.com](https://web3forms.com).
2. Enter the email address where the artist wants to receive contact messages.
3. Web3Forms will send an email to that address with an **access key**. Open that email and copy the key.

Keep this key — you will use it in the next step and again when setting up Vercel.

---

### Step 4: Configure Environment Variables Locally

The app reads configuration from a `.env.local` file. This file is never committed to git (it is in `.gitignore`).

1. In the project root, copy the example file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` in a text editor and fill in the values:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_READ_TOKEN=

WEB3FORMS_ACCESS_KEY=your-web3forms-key-here

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**What each variable does:**

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | The project ID from Step 2 (e.g., `abc12345`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Always `production` — matches the dataset name you created |
| `NEXT_PUBLIC_SANITY_API_VERSION` | The Sanity API date version — leave as `2024-01-01` |
| `SANITY_API_READ_TOKEN` | Optional — only needed if you add private/draft content fetching later; leave blank for now |
| `WEB3FORMS_ACCESS_KEY` | The key from Step 3 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev; the Vercel URL in production |

---

### Step 5: Test Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. You will see the portfolio frontend (likely empty until content is created).

4. Open [http://localhost:3000/studio](http://localhost:3000/studio) to access Sanity Studio. This is where content is managed.

5. In the Studio, create at minimum:
   - A **Site Settings** document (artist name is required — the site will not render correctly without it)
   - An **About Page** document
   - At least one **Project** with a cover image

This gives you real content to look at before deploying.

---

### Step 6: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New Project"** and select **"Import Git Repository"**.
3. Connect your GitHub account if you have not already, then select the repository you pushed in Step 1.
4. Vercel will auto-detect this as a Next.js project. Before clicking Deploy, go to **"Environment Variables"** and add all of the variables from your `.env.local` file:

   - `NEXT_PUBLIC_SANITY_PROJECT_ID` — your Sanity project ID
   - `NEXT_PUBLIC_SANITY_DATASET` — `production`
   - `NEXT_PUBLIC_SANITY_API_VERSION` — `2024-01-01`
   - `SANITY_API_READ_TOKEN` — leave blank unless you set a token
   - `WEB3FORMS_ACCESS_KEY` — your Web3Forms key
   - `NEXT_PUBLIC_SITE_URL` — **important:** set this to the Vercel URL you expect, e.g., `https://artistname.vercel.app`. If you do not know it yet, you can update this after the first deploy.

5. Click **Deploy**. Vercel will build and deploy the site. This takes about a minute.

6. Once deployed, Vercel shows you the assigned URL (e.g., `peppaportfolio.vercel.app`). Note this URL.

**Optionally rename the project** for a nicer subdomain: go to Vercel project **Settings > General > Project Name**, change it, and the subdomain will update to match (e.g., `artistname.vercel.app`).

**Update `NEXT_PUBLIC_SITE_URL`:** If you changed the project name or the URL differs from what you set, go to Vercel project **Settings > Environment Variables**, find `NEXT_PUBLIC_SITE_URL`, and update it to the correct production URL. Then trigger a redeploy (Vercel dashboard > Deployments > the latest deployment > three-dot menu > Redeploy).

---

### Step 7: Update Sanity CORS for Production

The Studio will not load on the live Vercel URL until you whitelist it in Sanity.

1. Go back to [sanity.io/manage](https://sanity.io/manage) and open your project.
2. Go to **API > CORS Origins**.
3. Click **Add CORS Origin**.
4. Enter your full production URL, e.g., `https://artistname.vercel.app`.
5. Check **"Allow credentials"**.
6. Click **Save**.

The artist can now log into the Studio at `https://artistname.vercel.app/studio`.

---

### Step 8: Seed Initial Content

Before handing off to the artist, create enough content for the site to look correct.

1. Go to the live Studio at `https://yoursite.vercel.app/studio`.
2. Create the **Site Settings** document:
   - Artist name (required)
   - Tagline
   - Social links (Instagram, etc.)
   - External shop URL if applicable
   - Contact form heading (e.g., "Get in touch")
3. Create the **About Page** document:
   - Heading (e.g., "About")
   - Bio text
   - Artist photo
4. Create **2–3 CV entries** to populate the CV page (one exhibition, one education entry).
5. Create **2–3 Projects**, each with at least one piece that has an image.
6. Visit the live site and verify all pages render correctly: Home, a project detail page, About, CV, Contact.

---

## Part 2: Artist Guide

Welcome! This guide will walk you through everything you need to know to manage your portfolio website. You do not need any technical knowledge — just follow the steps below.

---

### Accessing the Studio

Your portfolio has a built-in management area called the **Studio**. Think of it like the admin panel for your website.

To get there:

1. Open a web browser (Chrome, Safari, Firefox — any will do).
2. Go to: `https://yoursite.vercel.app/studio`
   (the developer will give you the exact address)
3. Log in with the Sanity account the developer set up for you. If you do not have one, ask the developer to send you an invite.

Once you are in, you will see a sidebar on the left with sections for:
- **About Page**
- **Site Settings**
- (a divider line)
- **Projects**
- **CV Entries**

---

### Managing Your Work

#### Adding a New Project

A **Project** is a body of work — like a series or collection. Each project has a cover image (the thumbnail shown on the homepage) and can contain multiple **pieces** (individual artworks).

To add a new project:

1. Click **Projects** in the left sidebar.
2. Click the **pencil/edit icon** or **"Create new document"** button (usually a + icon or a button at the top of the list).
3. Fill in the fields:
   - **Title** (required) — the name of the project, e.g., "Coastal Studies 2024"
   - **Slug** — this is the URL-friendly version of the title, e.g., `coastal-studies-2024`. Click **Generate** next to this field to create it automatically from the title. You rarely need to change this.
   - **Cover Image** (required) — this is the thumbnail shown on the homepage. Click the image area to upload a photo from your computer. Aim for a landscape or square image at least 1200px wide.
   - **Description** — a short paragraph about the project. This appears on the project's own page.
   - **Date** — the year or date of the project.
   - **Category** — a word or short phrase like "Painting", "Photography", or "Mixed Media".
   - **Sort Order** — a number that controls where this project appears on the homepage. Lower numbers appear first. For example, if you want this to be the first project shown, set it to `1`. If you want it second, set it to `2`.
4. Click **Publish** in the bottom-right corner when you are ready for it to appear on the site. If you click **Save** without publishing, it saves as a draft that only you can see in the Studio.

---

#### Adding Pieces to a Project

A **Piece** is an individual artwork within a project.

1. Open the project you want to add pieces to (click it in the Projects list).
2. Scroll down to the **Pieces** section.
3. Click **Add item** to add a new piece.
4. Fill in the fields:
   - **Title** (required) — the name of the artwork, e.g., "Untitled No. 3"
   - **Image** (required) — upload a photo of the artwork. Higher resolution is better — at least 1500px on the longest side, JPEG or PNG format.
   - **Year** — the year the piece was made (just a number, e.g., `2024`).
   - **Medium** — what it is made from, e.g., "Oil on canvas" or "Watercolour on paper".
   - **Dimensions** — the size, e.g., "40 x 50 cm" or "16 x 20 inches".
   - **Description** — any notes about this specific piece (optional).
   - **Price** — either a number (e.g., `1200`) or the text `POA` if the price is available on request.
   - **Availability** — choose one: **Available**, **Sold**, or **Not for sale**. This is shown in the lightbox when someone clicks on the image.
5. To add another piece, click **Add item** again.
6. Click **Publish** when you are done.

**To reorder pieces:** You can drag pieces up and down within the Pieces list by clicking and holding the drag handle (the dotted grip icon on the left side of each piece row) and moving it to the new position. The order here is the order they will appear on the website.

---

#### Updating the Homepage Order

The project with the **lowest Sort Order number** is shown as the large featured project at the top of the homepage. All other projects appear in the grid below it in ascending sort order.

To change which project is featured:

1. Click **Projects** in the sidebar.
2. Open the project you want to feature.
3. Scroll to the **Sort Order** field and set it to `1` (or any number lower than the others).
4. Open the project that was previously `1` and change its number to `2` (or higher).
5. Publish both changes.

For example:
- Project you want featured: Sort Order = `1`
- Second project: Sort Order = `2`
- Third project: Sort Order = `3`

---

#### Editing the About Page

1. Click **About Page** in the left sidebar.
2. You will see the document open directly (there is only one About Page).
3. Fields you can edit:
   - **Heading** — the title shown at the top of the About page, e.g., "About" or your name.
   - **Bio** — your biography or artist statement. This is a rich text editor — you can type paragraphs, make text bold, add bullet points, etc. Click into the text area and start typing.
   - **Artist Photo** — click the image area to upload a new photo of yourself.
4. Click **Publish** when done.

---

#### Managing Your CV

Your CV page is built from individual **CV Entries**. Each entry is one item — an exhibition, an educational qualification, an award, or a press mention.

**To add a new CV entry:**

1. Click **CV Entries** in the left sidebar.
2. Click the **+** or **Create new document** button.
3. Fill in the fields:
   - **Type** (required) — select one: **Exhibition**, **Education**, **Award**, or **Press**. This determines which section of the CV page the entry appears in.
   - **Title** (required) — the name of the exhibition, degree, award, or article, e.g., "Group Show: New Voices".
   - **Venue / Institution** — where it happened, e.g., "The Gallery, London" or "University of Arts".
   - **Year** (required) — the year as a number, e.g., `2023`.
   - **Description** — any additional details (optional).
4. Click **Publish**.

Entries are automatically grouped by type on the CV page, and sorted with the most recent year first within each group.

---

#### Updating Site Settings

Site Settings controls global information that appears across the whole website — your name, tagline, social media links, and the link to your external shop.

1. Click **Site Settings** in the left sidebar.
2. Fill in or update the fields:
   - **Artist Name** (required) — your name as it appears in the header and footer.
   - **Tagline** — a short phrase that describes your work, shown in search results and the browser tab.
   - **External Shop URL** — if you sell work through an external store (e.g., Etsy, your own Shopify), paste the full URL here. This makes the "Shop" link in the navigation go to that page. Leave it blank if you do not have a shop.
   - **Contact Form Heading** — the heading shown at the top of the Contact page, e.g., "Get in touch" or "Say hello".
3. Click **Publish**.

**Managing social links:**

Social links appear as icons in the footer.

- To **add** a social link: scroll to **Social Links**, click **Add item**, then enter the Platform name (e.g., `Instagram`) and the full URL (e.g., `https://instagram.com/yourhandle`).
- To **remove** a social link: click the three-dot menu (`...`) on the right side of the link row and select **Remove**.
- To **reorder** links: drag them using the grip handle on the left.

After making changes, click **Publish**.

---

### Tips for Great Results

**Image recommendations:**
- Use JPEG or PNG format.
- For artwork images (pieces), aim for at least 1500px on the longest side. Larger is better for the lightbox view.
- For the cover image (project thumbnail), a landscape orientation works best (wider than it is tall). At least 1200 x 800px.
- For your artist photo on the About page, a portrait or square crop works well. At least 800 x 800px.
- Try to keep individual file sizes under 5 MB — very large files can slow down the site.

**Previewing before publishing:**
- In the Studio, changes are only visible on the live website after you click **Publish**.
- If you want to save your work and come back to it later, click **Save** (not Publish). This creates a draft that only you can see.
- There is no separate preview mode — if you want to check how something will look, publish it, then visit the live site. You can always edit and republish.

**Unpublishing or deleting content:**
- To **unpublish** something (hide it from the site without deleting it): open the document, click the three-dot menu (`...`) near the Publish button, and select **Unpublish**. It will disappear from the site but remain in the Studio as a draft.
- To **delete** a document: open it, click the three-dot menu, and select **Delete**. Be careful — this cannot be undone.
- Note: you cannot delete the About Page or Site Settings — they are fixed documents. You can only edit them.

**If something looks wrong on the live site:**
1. Check that you remembered to click **Publish** (not just Save).
2. Wait 10–30 seconds after publishing — the site takes a moment to update.
3. Try a hard refresh in your browser: hold `Shift` and click the Reload button (or press `Ctrl+Shift+R` on Windows / `Cmd+Shift+R` on Mac).
4. If it still looks wrong after a minute, contact the developer.

**Checking the contact form:**
- Messages sent through the contact form on the website go directly to the email address set up with Web3Forms.
- Check your spam/junk folder if you are not receiving messages.
- You cannot see submitted messages inside the Studio — they arrive by email only.
