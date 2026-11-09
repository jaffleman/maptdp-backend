require("dotenv").config();

const express = require("express");

const tdpbddConnect = require("./app/tdpSeq");
const geobddConnect = require("./app/geoSeq");


const router = require("./app/router");
const bodyParser = require("body-parser");
const cors = require("cors");
const tdpController = require("./app/controller/tdpController");

const app = express();

const PORT = process.env.PORT || 3000;

(async function () {
  try {

    console.log("Try to connect the Géolock database.\nPlease wait...");
    console.log("I hope we can found it!");
    await geobddConnect.authenticate();
    console.log(
      "Connection has been established successfully to Géolock:",
      geobddConnect.options.host
    );

    console.log("Try to connect the database.\nPlease wait...");
    console.log("I hope we can found it!");
    await tdpbddConnect.authenticate();
    console.log(
      "Connection has been established successfully to MapTDP:",
      tdpbddConnect.options.host
    );
    const req = {
      body: [
        {
          rep: 'cac94',
          cd: 94,
          regletteType: 'L/INX',
          regletteNbr: '06',
          plot: [ '016' ],
          tdpId: 'cac94L/INX06'
        }
      ]
    };
    const res = {
      theStatusCode: 0,
      statusCode: (code) => { this.theStatusCode = code; return this; },
      json: (data) => {
        console.log("Response data:", data);
      }
    };
    await tdpController.search(req, res);
    res.theStatusCode === 200 ? console.log("TDP search successful") : console.log("TDP search failed with status code:", res.theStatusCode);

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(cors());

    app.options("*", cors());

    // LOG SIMPLE
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    // HEALTHCHECKS
    app.get("/healthz", (req, res) => {
      res.status(200).json({ status: "ok" });
    });

    // TEST ROUTE
    app.get("/", (req, res) => {
      res.status(200).json({ message: "API OK" });
    });

    app.use(router);

    app.use((err, req, res, next) => {
      console.error(err);

      return res.status(500).json({
        error: true,
        message: err.message,
      });
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database.\n", error);
  }
})();
