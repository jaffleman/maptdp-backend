const express = require("express");

const tdpController = require("./controller/tdpController");

const router = express.Router();

router.post("/search", tdpController.search);
router.post("/searchBp", tdpController.searchByPosition);
router.post("/searchRep", tdpController.searchRep);
router.post("/create", tdpController.create);
router.put("/update", tdpController.update);
router.delete("/delete", tdpController.delete);
router.get("/updateid", tdpController.updateid);
router.get("/healthz", tdpController.test);

module.exports = router;
