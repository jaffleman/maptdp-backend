const tdps = require("../models/tdp/tdpModel");
const marker = require("../models/geolock/markerModel");
const acces = require("../models/geolock/accesModel");
const { Op } = require("sequelize");
const { json } = require("body-parser");

marker.hasMany(acces, { foreignKey: "mk" }); // un marker peut posséder plusieurs acces : mk.acces => marker
acces.belongsTo(marker, { foreignKey: "id" }); // un acces appartien a un marker : id.maker => acces

const TOLERANCE = 5;
const SCREAN_TOLERANCE = 50;
const coordsParser = (coords) =>{
  const longitude = Math.round(coords.longitude * 100000);
  const latitude = Math.round(coords.latitude * 100000);
  const longDelta = Math.round(coords.longitudeDelta * 100000) | 200;
  const latDelta = Math.round(coords.latitudeDelta * 100000) | 200;
  console.log(JSON.stringify({longitude, latitude, longDelta, latDelta}))
  return {longitude, latitude, longDelta, latDelta}}

const mainSearchMarkerAcces = async ({longitude, latitude, longDelta, latDelta})=>{
  const intervalLat = [latitude - latDelta, latitude + latDelta];
  const intervalLon = [longitude - longDelta, longitude + longDelta];
  const markers = await marker.findAll({
    where: {
      //les contraintes
      longitude: { [Op.between]: intervalLon },
      latitude: { [Op.between]: intervalLat },},
    include: [
      {
        model: acces,
        required: true,},],});

  const convertMarkers = markers.map((m) => {
    return {
      id: m.id,
      longitude: m.longitude / 100000,
      latitude: m.latitude / 100000,
      author: m.author,
      adresse: m.adresse,
      accesNbr: m.accesNbr,
      createdDate:
        m.createdDate === null
          ? m.createdDate
          : new Date(m.createdDate).toDateString(),
      accesList: [...m.as],};});
  return convertMarkers}

const geoControler = {
  async getAllAcces(req, res) {
    console.log(req.body);
    const accesTab = await acces.findAll({
      attributes: ["id", "type", "code"], // les champs que l'on souhaite en retour de la requette
      where: {
        //les contraintes
        mk: req.body.id,
      },
    });
    console.log(accesTab);
    res.json(accesTab);
  },

  async searchByPosition(req, res) {
    console.log(req.body);
  },

  async findAllMarker(req, res) {
    console.log(req.body);
    const longitude = Math.round(req.body.longitude * 100000);
    const latitude = Math.round(req.body.latitude * 100000);
    const longDelta =
      Math.round(req.body.longitudeDelta * 100000) | SCREAN_TOLERANCE;
    const latDelta =
      Math.round(req.body.latitudeDelta * 100000) | SCREAN_TOLERANCE;
    const intervalLat = [latitude - latDelta, latitude + latDelta];
    const intervalLon = [longitude - longDelta, longitude + longDelta];
    const markers = await marker.findAll({
      attributes: [
        "id",
        "longitude",
        "latitude",
        "author",
        "adresse",
        "accesNbr",
        "createdDate",
      ], // les champs que l'on souhaite en retour de la requette
      where: {
        //les contraintes
        longitude: { [Op.between]: intervalLon },
        latitude: { [Op.between]: intervalLat },
      },
    });
    const cosvertMarkers = markers.map((m) => {
      return {
        longitude: m.longitude / 100000,
        latitude: m.latitude / 100000,
        id: m.id,
        author: m.author,
        adresse: m.adresse,
        accesNbr: m.accesNbr,
        createdDate:
          m.createdDate === null
            ? m.createdDate
            : new Date(m.createdDate).toDateString(),
      };
    });
    res.json(cosvertMarkers);
  },
  // cette route, contrairement à la route findAllMarker, permet d'envoyer pour une zone donnée les markers correspondants ainsi que leurs acces en une seul requête.
  // SELECT "m"."id", "m"."longitude", "m"."latitude", "m"."author", "m"."adresse", "m"."accesNbr", "m"."createdDate", "as"."id" AS "as.id", "as"."type" AS "as.type", "as"."code" AS "as.code", "as"."mk" AS "as.mk" FROM "marker" AS "m" INNER JOIN "acces" AS "as" ON "m"."id" = "as"."mk" WHERE "m"."longitude" BETWEEN W AND E "m"."latitude" BETWEEN N AND S;
  async findAllMarkersAndAcces(req, res) {
    console.log('get allMarker&Acces')
    console.log(req.body);
    res.json(await mainSearchMarkerAcces(coordsParser(req.body)))},

  async createMarker(req, res) {
    console.log('Creation d1 Marker')
    console.log(req.body);
    const parseCoords = coordsParser(req.body);
    const {longitude, latitude} = parseCoords
    const intervalLat = [latitude - TOLERANCE, latitude + TOLERANCE];
    const intervalLon = [longitude - TOLERANCE, longitude + TOLERANCE];
    const marker_id = await marker
      .findOrCreate({
        attributes: ["id"], // les champs que l'on souhaite en retour de la requette
        where: {
          //les contraintes
          longitude: { [Op.between]: intervalLon },
          latitude: { [Op.between]: intervalLat },},
        defaults: {
          longitude,
          latitude,
          author: req.body.author || "unknow",
          adresse: req.body.adresse || "unknow",
          createdDate: new Date(),},})
      .catch((err) => {
        throw err;});
    const acces_id = await acces
      .bulkCreate(
        req.body.acces.map(({ type, code }) => {
          console.log(marker_id);
          return { type, code, mk: marker_id[0].dataValues.id };}))
      .catch((err) => {
        throw err;});
    const refresh = await mainSearchMarkerAcces(parseCoords)
    res.json({isSuccesfull:true, refresh});},


  async createAcces(req, res) {
    let markerId = 0;
    console.log('Creation d acces...')
    console.log(req.body);
    const acces_id = await acces
      .bulkCreate(
        req.body.accesList.map(({ type, code, mk }) => {
          markerId = mk;
          return { type, code, mk};}))
      .catch((err) => {
        throw err;});
    let refresh = [];
    console.log("isLast: "+ req.body.isLast)
    if (req.body.isLast){
      const {longitude, latitude} = (await marker.findAll({attributes:["longitude", "latitude"],where :{id:markerId}}))[0].dataValues
      console.log('longitude: '+longitude+', latitude: '+latitude)
      refresh= await mainSearchMarkerAcces({longitude, latitude, longDelta:200, latDelta:200})}
    res.json({isSuccesfull:true, refresh});},

    
  async updateAcces(req, res) {
    const markerId = req.body.accesList[0].mk
    console.log('Mise à jour des acces')
    const updated = await acces.bulkCreate(req.body.accesList, {
      updateOnDuplicate: ["type", "code"],});
    let refresh = [];
    if (req.body.isLast){
      const {longitude, latitude} = (await marker.findAll({attributes:["longitude", "latitude"],where :{id:markerId}}))[0].dataValues
      console.log('longitude: '+longitude+', latitude: '+latitude)
      refresh= await mainSearchMarkerAcces({longitude, latitude, longDelta:200, latDelta:200})}
    res.json({isSuccesfull:true, refresh});},

  async updateMarker(req, res) {
    const currentMarker = {...req.body.marker}
    console.log('Mise à jour des markers')
	  console.log('contenu de la requete: '+JSON.stringify(currentMarker));
    const data = {};
    if ("adresse" in currentMarker) data.adresse = currentMarker.adresse;
    if ("longitude" in currentMarker)
      data.longitude = Math.round(currentMarker.longitude * 100000);
    if ("latitude" in currentMarker)
      data.latitude = Math.round(currentMarker.latitude * 100000);
    const updated = await marker.update(data, {
      where: { id: currentMarker.id },});
    let refresh = [];
    if (req.body.isLast){
      console.log('longitude: '+data.longitude+', latitude: '+data.latitude)
      refresh= await mainSearchMarkerAcces({
        longitude: data.longitude, latitude: data.latitude, longDelta:200, latDelta:200})}
    res.json({isSuccesfull:true, refresh});},

  updateid(req, res) {},

  async deleteMarker(req, res) {
    console.log('suppression de marker')
    const {longitude, latitude} = req.body.marker
    const suppMarker = await marker.destroy({
      where: { id: req.body.marker.id },});
      let refresh = [];
    if (req.body.isLast){
      console.log('longitude: '+longitude+', latitude: '+latitude)
      refresh= await mainSearchMarkerAcces(coordsParser({longitude, latitude}))}
    res.json({isSuccesfull:true, refresh});},


  async deleteAcces(req, res) {
    console.log('suppression d acces')
    const markerId = req.body.accesList[0].mk
    await req.body.accesList.map(curentAcces => acces.destroy({where:{id:curentAcces.id}}))
    let refresh = [];
    if (req.body.isLast){
      const {longitude, latitude} = (await marker.findAll({attributes:["longitude", "latitude"],where :{id:markerId}}))[0].dataValues
      console.log('longitude: '+longitude+', latitude: '+latitude)
      refresh= await mainSearchMarkerAcces({longitude, latitude, longDelta:200, latDelta:200})}
    res.json({isSuccesfull:true, refresh});},
    
  test(req, res) {
    res.status(200).end("maptdp-backend online.")
  },
};

module.exports = geoControler;
