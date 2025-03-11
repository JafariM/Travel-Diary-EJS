const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../util/seed_db");
const Travel = require("../models/Travel");

let testUser = null;

let page = null;
let browser = null;
// Launch the browser and open a new blank page
describe("travels-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    //await sleeper(5000)
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });
  after(async function () {
    this.timeout(5000);
    await browser.close();
  });
  describe("got to site", function () {
    it("should have completed a connection", async function () { });
  });
  describe("index page test", function () {
    this.timeout(10000);
    it("finds the index page logon link", async () => {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Click this link to logon)",
      );
    });
    it("gets to the logon page", async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      const email = await page.waitForSelector('input[name="email"]');
    });
  });
  describe("logon page test", function () {
    this.timeout(20000);
    it("resolves all the fields", async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });
    it("sends the logon", async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();
      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector("a ::-p-text(change the secret)");
      await page.waitForSelector('a[href="/secretWord"]');
      const copyr = await page.waitForSelector("p ::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text: ", copyrText);
    });
  });
  describe("puppeteer travel operations", function () {
    this.timeout(40000);

    it("clicks on link and verifies travel list", async () => {
      const { expect } = await import('chai');
      this.jobsLink = await page.waitForSelector(
        "a ::-p-text(Click this link to view your travels list.)",
      );
      await this.jobsLink.click();
      await page.waitForNavigation();

      const content = await page.content();
      const travels = content.split('<tr>').length - 1;
      expect(travels).to.equal(20, "Expected 20 travel entries.");
    });

    it("should open the add travel form and validate", async () => {
      const { expect } = await import('chai');
      const newTravelLink = await page.waitForSelector('a[href="/travels/add"]');
      await newTravelLink.click();
      await page.waitForNavigation();

      const placeNameField = await page.waitForSelector('input[name="placeName"]');
      const locationField = await page.waitForSelector('input[name="location"]');
      const visitDateField = await page.waitForSelector('input[name="visitDate"]');
      const addButton = await page.waitForSelector('button[type="submit"]');

      expect(placeNameField).to.exist;
      expect(locationField).to.exist;
      expect(visitDateField).to.exist;
      expect(addButton).to.exist;

      const placeNameValue = await placeNameField.evaluate(el => el.value);
      const locationValue = await locationField.evaluate(el => el.value);
      const visitDateValue = await visitDateField.evaluate(el => el.value);

      expect(placeNameValue).to.equal('');
      expect(locationValue).to.equal('');
      expect(visitDateValue).to.equal('pending');

    });
    it("fill out the form and add travel", async () => {
      const { expect } = await import('chai');

      const placeNameField = await page.waitForSelector('input[name="placeName"]',);
      const locationField = await page.waitForSelector('input[name="location"]');
      const visitDateField = await page.waitForSelector('input[name="visitDate"]');
      const addButton = await page.waitForSelector('button[type="submit"]');

      const placeName = "Place Name";
      const location = "location";
      const visitDate = "visit Date";

      await placeNameField.type(placeName);
      await locationField.type(location);
      await visitDateField.type(visitDate);

      await addButton.click();
      await page.waitForNavigation();

      const lastTravel = await Travel.findOne({}).sort({ createdAt: -1 }).exec();
      expect(lastTravel).to.exist;
      expect(lastTravel.placeName).to.equal(placeName);
      expect(lastTravel.location).to.equal(location);
      expect(lastTravel.visitDate).to.equal(visitDate);

    });
  });

});