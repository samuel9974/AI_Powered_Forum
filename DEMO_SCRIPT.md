# Live demo script

Use this while you record. Paste the blocks. Do not invent text on camera.

Before you press record:

- Backend is running at `http://localhost:5000`.
- Frontend is running at `http://localhost:5173`.
- You are signed out, or you start from the landing page.
- A real PDF under 5 MB is already on your desktop. The upload button accepts PDF only.
- You will answer two threads that other people already posted. You cannot answer a question you posted yourself.

Shot order: sign in, keyword search, AI search, post a question with AI suggestions, answer two existing threads, upload a PDF and ask it, then the chatbot.

---

## 1. Sign in

Open `http://localhost:5173`.

Click **Sign in**. Use your account. Land on **Forum home**.

Say: this is the feed. Search is in the top bar. New question, Your topics, and Knowledge base are the shortcuts.

## 2. Keyword search

Click the search box. Type:

```text
express
```

Wait until the address becomes `/dashboard?q=express`.

Say: this match is by the word itself, in the title and the body.

## 3. AI search

Clear the box. Type:

```text
how do I keep a React page from fetching forever
```

Click **AI Search**. The address must stay `/dashboard?semantic=...`. Do not let it flip back to `?q=`.

Say: this match is by meaning, not by the same words.

Open the thread **Why is my React component not re-rendering after state updates?** if it appears. If it does not, go back to the feed. Do not stop the recording.

## 4. Post a question, with AI suggestions

Click **New question**.

Title:

```text
React useEffect runs my fetch on every render
```

Body:

```text
I load a user profile inside useEffect. After setUser runs, the request fires again and the network tab never stops.

Expected: one GET /api/me when the page opens.
Actual: a new request after every state update.

I included the user object in the dependency array. I am using React 19 and Vite.
```

Click **AI suggestions**. Wait for the tips. Read one tip out loud. Do not edit the draft unless a tip is obviously wrong.

Click **Post Question**, then **View Question**.

Say: I posted this. I cannot answer my own thread. Peers answer it.

Do not type an answer on this page.

## 5. Answer an existing thread

Go **Home**. Open **How do I connect Express to MySQL?**

If that title is missing, open any thread whose author is not you. The composer must say **Contribute an answer**, not the note about your own thread.

Paste:

```text
Create the pool once, outside the route, with mysql2/promise.

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

In the route, use const [rows] = await pool.execute('SELECT id, title FROM questions WHERE id = ?', [id]). Always pass values as parameters. Call pool.end() only when the process shuts down, not after each request.
```

Click **Check draft fit**. Wait for strong, partial, or weak. Then submit the answer.

Say: the fit check only scores whether the reply matches the question. It does not grade the code.

## 6. Answer a second existing thread

Go back to the feed. Open **How do I implement JWT authentication in Express?**

Paste:

```text
Sign the token on login, after the password check succeeds.

const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

On protected routes, read the Authorization header, require the Bearer prefix, and call jwt.verify. Put the user id from the payload on req.user. If the header is missing or verify throws, return 401. Do not store the password in the token.
```

Submit the answer. You can skip **Check draft fit** on this one if you already showed it.

## 7. Upload a PDF

Open **Knowledge base** in the sidebar.

Click **Choose file**. Pick the PDF from your desktop. Click **Upload**. Wait until the status is ready. This can take a while because the file is chunked and embedded.

Then, in **Ask with AI**, paste:

```text
What are the main steps this document tells me to follow?
```

Click **Ask**. Show the answer and any citation.

Say: this answer is limited to that PDF. Other users do not see this file.

## 8. Chatbot

Click **Ask AI** in the top bar, or open **Evangadi Assistant** if you want the full page.

Click the suggestion **What programs does Evangadi offer?** Wait for the reply.

Then send this follow-up:

```text
What are the class schedules like?
```

Say: this assistant uses the Evangadi knowledge base, not the PDF I just uploaded.

## 9. End

Click **Your topics**. Your new useEffect thread should be there. The two answers you wrote should not be, because those questions belong to other people.

Sign out if you want the ending frame on the landing page.

---

## Spare question

Use this only if the first post fails or you want a second post. Same path: **New question**, **AI suggestions**, **Post Question**. Do not answer it yourself.

Title:

```text
Express returns 401 on every protected route
```

Body:

```text
Login returns a token, and the client sends Authorization: Bearer <token>. GET /api/questions still returns 401 Authentication invalid.

Expected: the feed loads for a signed-in user.
Actual: 401 immediately after login.

JWT_SECRET is set in backend/.env. The token is stored in localStorage. I am calling the local API at http://localhost:5000.
```

## If something stalls

- AI suggestions, answer fit, upload, and the chatbot can take several seconds. Stay on the click. Do not refresh.
- If **Contribute an answer** is missing, you opened your own thread. Pick another title.
- If upload says only PDF files are allowed, the file is not a PDF or it is over 5 MB.
- Keyword search uses `?q=`. AI search uses `?semantic=` and must stay there.
