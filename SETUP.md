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
- A **Stripe account** — free at [stripe.com](https://stripe.com) (needed for the shop and subscriptions)

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

### Step 4: Create a Stripe Account

The site uses Stripe to process payments for artwork purchases and subscriptions. Stripe has no monthly fee — they only charge per transaction (1.7% + 30¢ domestic AUD, 3.5% + 30¢ international).

1. Go to [dashboard.stripe.com/register](https://dashboard.stripe.com/register) and create an account.
2. Complete the onboarding (business name, country, bank details for payouts). Set country to **Singapore** — the checkout charges in SGD.
3. You can start in **test mode** and activate live payments later once everything is verified.

To get the API key:

1. In Stripe Dashboard, click **Developers** (top right) → **API keys**.
2. Copy the **Secret key** (starts with `sk_test_...` in test mode, `sk_live_...` in production).

Keep this key — you will use it in the next step and again when deploying to Vercel.

---

### Step 5: Configure Environment Variables Locally

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
STRIPE_SECRET_KEY=sk_test_your-key-here

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
| `STRIPE_SECRET_KEY` | The secret key from Step 4 — server-only, never exposed to the browser |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev; the Vercel URL in production |

---

### Step 6: Test Locally

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
   - At least one **Project** with a cover image and at least one piece with a numeric price and availability set to "Available"

6. Test the shop features:
   - Visit [http://localhost:3000/shop](http://localhost:3000/shop) — your available pieces should appear.
   - Click "Add to Cart" on a piece → the cart drawer should slide open.
   - Click "Checkout" → you should be redirected to Stripe's test checkout page.
   - Use Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC, any name/address.
   - After completing the test payment, you should land on the success page and the cart should be empty.
   - Visit [http://localhost:3000/subscribe](http://localhost:3000/subscribe) — will show "Subscription tiers coming soon" until you create tiers (see Step 9).

This gives you real content to look at before deploying.

---

### Step 7: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New Project"** and select **"Import Git Repository"**.
3. Connect your GitHub account if you have not already, then select the repository you pushed in Step 1.
4. Vercel will auto-detect this as a Next.js project. Before clicking Deploy, go to **"Environment Variables"** and add all of the variables from your `.env.local` file:

   - `NEXT_PUBLIC_SANITY_PROJECT_ID` — your Sanity project ID
   - `NEXT_PUBLIC_SANITY_DATASET` — `production`
   - `NEXT_PUBLIC_SANITY_API_VERSION` — `2024-01-01`
   - `SANITY_API_READ_TOKEN` — leave blank unless you set a token
   - `WEB3FORMS_ACCESS_KEY` — your Web3Forms key
   - `STRIPE_SECRET_KEY` — your Stripe secret key (use `sk_test_...` for initial testing, switch to `sk_live_...` when going live)
   - `NEXT_PUBLIC_SITE_URL` — **important:** set this to the Vercel URL you expect, e.g., `https://artistname.vercel.app`. If you do not know it yet, you can update this after the first deploy.

5. Click **Deploy**. Vercel will build and deploy the site. This takes about a minute.

6. Once deployed, Vercel shows you the assigned URL (e.g., `peppaportfolio.vercel.app`). Note this URL.

**Optionally rename the project** for a nicer subdomain: go to Vercel project **Settings > General > Project Name**, change it, and the subdomain will update to match (e.g., `artistname.vercel.app`).

**Update `NEXT_PUBLIC_SITE_URL`:** If you changed the project name or the URL differs from what you set, go to Vercel project **Settings > Environment Variables**, find `NEXT_PUBLIC_SITE_URL`, and update it to the correct production URL. Then trigger a redeploy (Vercel dashboard > Deployments > the latest deployment > three-dot menu > Redeploy).

---

### Step 8: Update Sanity CORS for Production

The Studio will not load on the live Vercel URL until you whitelist it in Sanity.

1. Go back to [sanity.io/manage](https://sanity.io/manage) and open your project.
2. Go to **API > CORS Origins**.
3. Click **Add CORS Origin**.
4. Enter your full production URL, e.g., `https://artistname.vercel.app`.
5. Check **"Allow credentials"**.
6. Click **Save**.

The artist can now log into the Studio at `https://artistname.vercel.app/studio`.

---

### Step 9: Seed Initial Content

Before handing off to the artist, create enough content for the site to look correct.

1. Go to the live Studio at `https://yoursite.vercel.app/studio`.
2. Create the **Site Settings** document:
   - Artist name (required)
   - Tagline
   - Social links (Instagram, etc.)
   - Contact form heading (e.g., "Get in touch")
   - Subscribe page heading (e.g., "Support My Work") — optional
   - Subscribe page description — optional
3. Create the **About Page** document:
   - Heading (e.g., "About")
   - Bio text
   - Artist photo
4. Create **2–3 CV entries** to populate the CV page (one exhibition, one education entry).
5. Create **2–3 Projects**, each with at least one piece that has an image, a price, and availability set to "Available".
6. Visit the live site and verify all pages render correctly: Home, a project detail page, About, CV, Contact, Shop.

---

### Step 10: Set Up Subscription Tiers (Optional)

If the artist wants to offer subscriptions (patronage, supporter tiers, etc.), this is a two-part process:

**In Stripe Dashboard:**

1. Go to **Products** → **Add product**.
2. Name it (e.g., "Monthly Supporter", "Patron Tier").
3. Set pricing to **Recurring** → choose interval (monthly/yearly) → set amount in AUD.
4. Save. Click into the product → under **Pricing**, copy the **Price ID** (starts with `price_...`).
5. Repeat for each tier you want to offer.

**In Sanity Studio:**

1. Go to the Studio → **Subscription Tiers** in the sidebar.
2. Click **+** to create a new tier.
3. Fill in:
   - **Name**: e.g., "Monthly Supporter"
   - **Display Price**: e.g., "$10/month" (free text — this is what visitors see)
   - **Description**: what the subscriber gets or a thank-you message
   - **Stripe Price ID**: paste the `price_...` ID from Stripe
   - **Sort Order**: 1, 2, 3... (controls display order on the page)
4. Publish.

The tier will now appear on the `/subscribe` page.

---

### Step 11: Go Live with Stripe Payments

When ready to accept real money (not just test payments):

1. In Stripe Dashboard → **Settings** → complete account activation (identity verification, bank account for payouts).
2. Toggle off test mode (top-right switch in Stripe Dashboard).
3. Get the **live** secret key (`sk_live_...`) from Developers → API keys.
4. In Vercel → project **Settings → Environment Variables**, update `STRIPE_SECRET_KEY` with the live key.
5. If you created subscription products in test mode, you must recreate them in live mode (Stripe keeps test and live products separate). Update the Stripe Price IDs in Sanity Studio accordingly.
6. Trigger a redeploy in Vercel.
7. Test with a real card (a small-amount purchase you can refund immediately).

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
- **Subscription Tiers**

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

Site Settings controls global information that appears across the whole website — your name, tagline, social media links, and page headings.

1. Click **Site Settings** in the left sidebar.
2. Fill in or update the fields:
   - **Artist Name** (required) — your name as it appears in the header and footer.
   - **Tagline** — a short phrase that describes your work, shown in search results and the browser tab.
   - **External Shop URL** — if you also sell work through an external store (e.g., Etsy), paste the full URL here. Otherwise leave blank.
   - **Contact Form Heading** — the heading shown at the top of the Contact page, e.g., "Get in touch" or "Say hello".
   - **Subscribe Page Heading** — the heading on your Subscribe page, e.g., "Support My Work".
   - **Subscribe Page Description** — optional paragraph shown below the heading on the Subscribe page explaining what supporters get.
3. Click **Publish**.

**Managing social links:**

Social links appear as icons in the footer.

- To **add** a social link: scroll to **Social Links**, click **Add item**, then enter the Platform name (e.g., `Instagram`) and the full URL (e.g., `https://instagram.com/yourhandle`).
- To **remove** a social link: click the three-dot menu (`...`) on the right side of the link row and select **Remove**.
- To **reorder** links: drag them using the grip handle on the left.

After making changes, click **Publish**.

---

### The Shop

Your website has a built-in shop at `/shop`. It automatically shows all pieces that are marked **Available** and have a price set. You do not need to do anything special to "add" a piece to the shop — it happens automatically based on the fields you fill in.

#### How a Piece Appears in the Shop

For a piece to show up on the Shop page with an "Add to Cart" button, it needs:
- **Availability** set to **Available**
- **Price** set to a number (e.g., `450`)

If you set the price to **POA** (Price on Application), the piece will still appear on the Shop page, but instead of "Add to Cart" it will show a "Contact to Purchase" button that sends visitors to the contact form.

If availability is set to **Sold** or **Not for sale**, the piece will not appear on the Shop page at all.

#### When Someone Buys a Piece

1. You will receive a notification from Stripe (email) that a payment has been made.
2. The buyer's shipping address is included in the Stripe payment details.
3. Go to your Stripe Dashboard ([dashboard.stripe.com](https://dashboard.stripe.com)) to see the full order details, buyer's address, and payment status.
4. **Important**: After confirming the sale, go to the Studio, open the project containing that piece, change the piece's **Availability** from "Available" to **"Sold"**, and click **Publish**. This removes it from the shop so nobody else can buy it.

#### Viewing Your Orders and Payments

All payment information is in your Stripe Dashboard — not in the Studio. To check orders:

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and log in.
2. Click **Payments** in the left sidebar to see all completed payments.
3. Click any payment to see the buyer's name, email, shipping address, and what they bought.
4. Stripe sends your earnings to your connected bank account on a regular schedule (usually every few days).

#### Refunding a Payment

If you need to refund a buyer:

1. In Stripe Dashboard, go to **Payments**.
2. Find the payment and click on it.
3. Click the **Refund** button in the top right.
4. Choose full or partial refund and confirm.

---

### Subscriptions

Your website has a `/subscribe` page where visitors can sign up for recurring support (like a monthly patronage). This is optional — if you have not set up any subscription tiers, the page will simply say "Subscription tiers coming soon."

#### Managing Subscription Tiers

Subscription tiers are managed in **two places**: Stripe (for the actual billing) and the Studio (for what visitors see on the page).

**To add a new tier:**

1. First, create the product in Stripe: go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Products** → **Add product**. Give it a name, set pricing to **Recurring** (monthly or yearly), and set the amount. Save it, then copy the **Price ID** (starts with `price_...`).
2. Then, go to the Studio → **Subscription Tiers** → click **+** to create a new tier.
3. Fill in:
   - **Name** — what visitors see, e.g., "Monthly Supporter"
   - **Display Price** — free text shown on the card, e.g., "$10/month"
   - **Description** — what the subscriber gets or a thank-you note
   - **Stripe Price ID** — paste the `price_...` ID from Stripe
   - **Sort Order** — a number controlling the order tiers appear (1 = first, 2 = second, etc.)
4. Click **Publish**.

**To remove a tier:** Delete or unpublish it in the Studio. You should also archive the corresponding product in Stripe Dashboard (Products → click the product → Archive).

**To change a tier's price:** You cannot edit a Stripe price directly. Instead: create a new price in Stripe (on the same product), update the Stripe Price ID in the Studio tier document, and publish. Then archive the old price in Stripe.

#### Viewing Your Subscribers

Go to Stripe Dashboard → **Customers** to see who has subscribed, or **Subscriptions** to see all active subscriptions, their status, and billing history.

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

**About prices and currency:**
- All prices on the site are in Singapore Dollars (SGD) and shown with a `$` symbol.
- When you enter a price for a piece in the Studio, just enter the number (e.g., `450`). The website adds the `$` automatically.
- Enter `POA` (Price on Application) if you do not want to show a price but still want the piece visible on the shop page with a "Contact to Purchase" option.

**About shipping:**
- When someone buys a piece, Stripe collects their shipping address at checkout. You will see this address in your Stripe Dashboard.
- Shipping cost is not calculated automatically — you arrange shipping directly with the buyer after the sale. Many artists include shipping in the price or contact the buyer with a shipping quote.
- Currently, buyers can ship to: Singapore, United States, Great Britain, Australia, Canada, New Zealand, Malaysia, and Japan. If you need to change this list, ask the developer.
