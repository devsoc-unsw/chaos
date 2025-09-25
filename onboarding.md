<!-- Written by Isaac Kim (2025) -->
## Hello and welcome to CHAOS!
These questions are there to help familiarise you with the codebase. The goal is for you to get lost and then eventually find your own way to the solutions. The best way to form a personal mental map of something is to get lost in it first, so if you do get lost, please remember this is what we are aiming for! After getting lost, it is up to you to find your way out on your own. You should be able to answer every question from the codebase alone (except maybe googling syntax things if you are not too familiar with `Rust`, `React` or any library we are using as well as other concepts or terminology you are not familiar with in the questions (e.g. `what is a HTTP response object?`)). Try to give reasoning for all your responses. 

> For this reason, if you use agentic AI assistance in your editors (e.g. Cursor, Claude Code, Github Copilot etc.), it is recommended you leave these tools as a **last resort** for these exercises. We really want you to actually get lost first!

---

### Backend
#### Getting started
0. Make sure you have `Rust` installed! You can refer to the [Rust Book](https://doc.rust-lang.org/book/ch01-01-installation.html) for installation instructions. This book can also a useful beginner-friendly reference guide for `Rust` if you are unfamiliar with some things in the backend codebase! For `Axum` related things, you can refer to [this repo](https://github.com/joelparkerhenderson/demo-rust-axum).
    - you will also need to have `Docker` installed for the `setup-dev-env.sh` script mentioned in the `README.md` file (mentioned below) to work as intended. If you don't have `Docker` installed already, I recommend you install [Docker Desktop](https://docs.docker.com/desktop).
1. Start the backend (hint: you may want to look at the `README.md` file in the `backend` directory)
2. Make a `GET` request to the root backend route. What is in the response object?
- (your answer here)
#### Exploring the routes
3. Which API route should you call if:
    1. you want a <ins>list of all applications for the current user<ins>?
    - (your answer here)
    2. What HTTP method would you be making this API call with?
    - (your answer here)
    3. What request body does this API call require (if it does not, explain why)?
    - (your answer here)
    4. How would the response object for this API call look (if any)? 
    - (your answer here)
4. What API route should you call if:
    1. you want to <ins>update a campaign<ins>?
    - (your answer here)
    2. What HTTP method would you be making this API call with?
    - (your answer here)
    3. What request body does this API call require (if it does not, explain why)?
    - (your answer here)
    4. How would the response object for this API call look (if any)? 
    - (your answer here)
5. What API route should you call if:
    1. you want to <ins>update an email template<ins>?
    - (your answer here)
    2. What HTTP method would you be making this API call with?
    - (your answer here)
    3. What request body does this API call require (if it does not, explain why)?
    - (your answer here)
    4. How would the response object for this API call look (if any)? 
    - (your answer here)
#### PostgreSQL
6. Explain what each line in this query is doing:
    ```postgres
    1. SELECT submitted, c.ends_at FROM applications a
    2. JOIN campaigns c on c.id = a.campaign_id
    3. WHERE a.id = 12345
    ```
    1. (your answer here)
    2. (your answer here)
    3. (your answer here)
7. Explain what each line in this query is doing:
    ```postgres
    1. SELECT app.submitted, c.ends_at FROM answers ans
    2. JOIN applications app ON app.id = ans.application_id
    3. JOIN campaigns c on c.id = app.campaign_id
    4. WHERE ans.id = 54321
    ```
    1. (your answer here)
    2. (your answer here)
    3. (your answer here)
    4. (your answer here)
8. Explain what each line in this query is doing:
    ```postgres
    1. SELECT o.id, o.slug, o.name, o.logo, o.created_at
    2. FROM organisations o
    3. JOIN organisation_members om
    4. ON o.id = om.organisation_id 
    5. WHERE om.user_id = 98765
    6. AND om.role = 'Admin'
    ```
    1. (your answer here)
    2. (your answer here)
    3. (your answer here)
    4. (your answer here)
    5. (your answer here)
    6. (your answer here)
9. Write a query that retrieves the `campaign name`, `slug`, and `organisation id`, for all `campaigns` <ins>in the past year in alphabetical order of organisation names</ins>.
- (your answer here)
10. Given a campaign with id `112233` write a query that <ins>retrieves all the applications from this campaign</ins> which meet the following conditions:
    1. have been created in the last 17 days 
    2. have even numbered ids
    3. have been submitted
    4. have been reviewed (status is not `pending`)
11. Write a query that retrieves all `campaigns` with **only** `dropdown` questions types, with every `dropdown` question having less than `3` answer options.
### Adding to the codebase (putting it all together)
10. Let's say that we want to expand `CHAOS` to keep track of `University`. We want to write some code to be able to <ins>fetch a university by its ID</ins>. We can imagine a university struct might look something like this:
    ```rust
    University {
        id: i64,
        name: String, 
    }
    ```
    1. Where would you write the code that interfaces with the database? Please include the file name, location and code in your response. 
    2. Where would you write the code that handles the HTTP request? Please include the file name, location and code in your response.
    3. What would the API URL look like?
    4. Which HTTP method would you use?

### Frontend