const express = require("express");

const tdpController = require("./controller/tdpController");

const router = express.Router();

router.post("/tdp/search", tdpController.search);
router.post("/tdp/searchBp", tdpController.searchByPosition);
router.post("/tdp/searchRep", tdpController.searchRep);
router.post("/tdp/create", tdpController.create);
router.put("/tdp/update", tdpController.update);
router.delete("/tdp/delete", tdpController.delete);
router.get("/tdp/updateid", tdpController.updateid);
router.get("/tdp/healthz", tdpController.test);


router.post("/geolock/createMarker", geoController.createMarker);
router.post("/geolock/createAcces", geoController.createAcces);
router.post("/geolock/findAllMarker", geoController.findAllMarker);
router.post("/geolock/getAllAcces", geoController.getAllAcces);
router.put("/geolock/updateAcces", geoController.updateAcces);
router.put("/geolock/updateMarker", geoController.updateMarker);
router.delete("/geolock/deleteMarker", geoController.deleteMarker);
router.delete("/geolock/deleteAcces", geoController.deleteAcces);
router.get("/geolock/updateid", geoController.updateid);
router.post(
  "/geolock/findAllMarkers&acces",
  geoController.findAllMarkersAndAcces
);


module.exports = router;
