const { app } = require("../app");
const { factory, seed_db } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");

const User = require("../models/User");

describe("tests for registration and logon", function () {
  // after(() => {
  //   server.close();
  // });
  it("should get the registration page", async () => {
    const { expect, request } = await get_chai();
  
    // Step 1: Dummy request to establish session
    const initialRes = await request.execute(app).get("/").send();
    const initialCookies = initialRes.headers["set-cookie"];
    const sessionCookie = initialCookies.find((cookie) => cookie.startsWith("connect.sid"));
    expect(sessionCookie).to.not.be.undefined;
  
    // Step 2: Request the registration page with the session cookie
    const res = await request.execute(app)
      .get("/sessions/register")
      .set("Cookie", sessionCookie.split(";")[0])
      .send();
  
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");
  
    // Extract CSRF token from form
    const csrfTokenMatch = /_csrf" value="(.*?)"/.exec(res.text.replaceAll("\n", ""));
    expect(csrfTokenMatch).to.not.be.null;
    this.csrfToken = csrfTokenMatch[1];
  
    // Extract CSRF cookie
    const cookies = res.headers["set-cookie"];
    const rawCsrfCookie = cookies.find((cookie) => cookie.startsWith("csrfToken"));
    expect(rawCsrfCookie).to.not.be.undefined;
  
    const cookieValue = decodeURIComponent(rawCsrfCookie.split("=")[1].split(";")[0]);
    const extractedToken = cookieValue.startsWith("s:") 
      ? cookieValue.slice(2).split(".")[0] 
      : cookieValue.split(".")[0];
  
      this.csrfCookie = cookies.find((element) =>
        element.startsWith("csrfToken"),
    );
    this.sessionCookie = sessionCookie.split(";")[0];
  
    console.log("Extracted Token from Cookie:", extractedToken);
    console.log("Token from Form:", this.csrfToken);
  
    // Assert that tokens match
    expect(extractedToken).to.equal(this.csrfToken);
  });
  // Helper to combine cookies
const combineCookies = (csrfCookie, sessionCookie) => {
  return `${csrfCookie}; ${sessionCookie}`;
};

// Register the user
it("should register the user", async () => {
  const { expect, request } = await get_chai();
  this.password = faker.internet.password();
  this.user = await factory.build("user", { password: this.password });

  const dataToPost = {
    name: this.user.name,
    email: this.user.email,
    password: this.password,
    password1: this.password,
    _csrf: this.csrfToken,
  };

  const req = request
    .execute(app)
    .post("/sessions/register")
    .set("Cookie", this.csrfCookie) // Only CSRF cookie needed here
    .set("content-type", "application/x-www-form-urlencoded")
    .send(dataToPost);

  const res = await req;
  expect(res).to.have.status(200);
  expect(res.text).to.include("Travel List");

  const newUser = await User.findOne({ email: this.user.email });
  expect(newUser).to.not.be.null;
});

// Log in the user
it("should log the user on", async () => {
  const dataToPost = {
    email: this.user.email,
    password: this.password,
    _csrf: this.csrfToken, 
  };

  const { expect, request } = await get_chai();
  const req = request
    .execute(app)
    .post("/sessions/logon")
    .set("Cookie", this.csrfCookie)
    .set("content-type", "application/x-www-form-urlencoded")
    .redirects(0)
    .send(dataToPost);

  const res = await req;
  expect(res).to.have.status(302);
  expect(res.headers.location).to.equal("/");

  // Save the session cookie
  const cookies = res.headers["set-cookie"];
  this.sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("connect.sid")
  ).split(";")[0];

  expect(this.sessionCookie).to.not.be.undefined;
});

// Get the index page with both cookies
it("should get the index page", async () => {
  const { expect, request } = await get_chai();
  const req = request
    .execute(app)
    .get("/")
    .set("Cookie", combineCookies(this.csrfCookie, this.sessionCookie)) // Combine cookies
    .send();

  const res = await req;
  expect(res).to.have.status(200);
  expect(res.text).to.include(this.user.name);
});
})