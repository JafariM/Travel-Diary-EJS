const Travel = require("../models/Travel");
const { seed_db, testUserPassword } = require("../util/seed_db");
const { app } = require("../app");
const get_chai = require("../util/get_chai");

describe("CRUD Operations Tests", function () {
  before(async function () {
    const { expect, request } = await get_chai();

    // Seed the database with a test user
    this.test_user = await seed_db();

    // Get logon page to fetch CSRF token and initial cookies
    let req = request.execute(app).get("/sessions/logon").send();
    let res = await req;

    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];

    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken")
    );

    // Prepare data for login
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };

    // Perform login
    req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    res = await req;
    cookies = res.headers["set-cookie"];

    // Save session cookie for authenticated requests
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid")
    );

    // Validations to ensure setup was successful
    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });
  it("should get the list of travels", async function () {
    const { expect, request } = await get_chai();

    // Fetch the travel list page with session cookie
    const res = await request
      .execute(app)
      .get("/travels")
      .set("Cookie", this.sessionCookie);

    // Verify status and the number of job entries (20 travels + header row)
    expect(res).to.have.status(200);
    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21);
  });
  it("should add a new travel entry", async function () {
    const { expect, request } = await get_chai();

    // Create travel data using factory
    const newTravel = await factory.build("travel");
    newTravel._csrf = this.csrfToken;

    // Post the new travel entry
    const res = await request
      .execute(app)
      .post("/travels")
      .set("Cookie", `${this.sessionCookie}; ${this.csrfCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(newTravel);

    expect(res).to.have.status(302); // Assuming redirect after success

    // Verify the new travel entry in the database
    const travelCount = await Travel.countDocuments();
    expect(travelCountCount).to.equal(21);
  });
});
