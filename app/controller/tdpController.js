const tdps = require("../models/tdpModel");
const repartiteurs = require("../models/repModel");
const reglettes = require('../models/regModel')
const options = require('../models/optModel');
const { request } = require("express");

// la premiere chose a faire c'est de definir les relations entre tables pour que les jointures fonctionnes
// on n'a aucune table pivot mais uniquement des foreignkey situées dans notre table tdps
repartiteurs.hasMany(tdps, {foreignKey:'id'}); // id d'un element de repartiteur correspond a plusieurs elements de tdps (1 to many)
reglettes.hasMany(tdps,{foreignKey: 'id'});
options.hasMany(tdps,{foreignKey:'id'})

tdps.belongsTo(reglettes,{foreignKey:'reglette_type'});//le champ 'reglette_type' d'un element de tdps correspond a un seul element de la table reglette (1 to 1)
tdps.belongsTo(repartiteurs, {foreignKey:'rep'}); 
tdps.belongsTo(options, {foreignKey:'opts'})

const tdpController = {
  async search(req, res) {
    console.log("search request received", req.body);
    // recherche d'un tdp (exemple: 'cho94 L/INX19120')
    // voici un exemple de requette générée par search()
    //SELECT "tdps"."id", "tdps"."reglette_nbr", "tdps"."salle", "tdps"."rco", "tdps"."ferme", "tdps"."level", "repartiteur"."id" AS "repartiteur.id", "repartiteur"."code_name" AS "repartiteur.code_name", "repartiteur"."zip" AS "repartiteur.zip", "reglette"."id" AS "reglette.id", "reglette"."reglette_label" AS "reglette.reglette_label", "opt"."id" AS "opt.id", "opt"."opt_label" AS "opt.opt_label" FROM "tdps" AS "tdps" INNER JOIN "repartiteurs" AS "repartiteur" ON "tdps"."rep" = "repartiteur"."id" AND "repartiteur"."code_name" = 'cho' AND "repartiteur"."zip" = 94 INNER JOIN "reglettes" AS "reglette" ON "tdps"."reglette_type" = "reglette"."id" AND "reglette"."reglette_label" = 'L/INX' LEFT OUTER JOIN "opts" AS "opt" ON "tdps"."opts" = "opt"."id" WHERE "tdps"."reglette_nbr" = '19' LIMIT 1;

    if (req.body.length < 1) res.status(200).end("pas de tdp dans la demande");  //on verifie que la demande n'est pas null
    const results =[]; // un tableau pour stocker les resultats
    for (let i = 0; i < req.body.length; i++) { //on boucle dans le cas ou on a plusieur rep dans la demande
      try {
        const result = await tdps.findOne({ //recheche tout dans la table tdps 
          attributes: ["reglette_nbr", "salle", "rco", "ferme", "level"], // ici on definit les champs que l'on souhaite en retour de la requette (SELECT en sql)
          include: [{ //jointure a la table repartiteurs (INNER JOIN en sql) oui car il faut qu'on connaisse l'id du rep concerné afin de construire la requette a la table tdps (foreign key)
            model: repartiteurs,
            attributes: ["code_name", "zip"], //on souhaite egalement certains champs de cette table dans notre retour
            required: true,
            where:{ // ici les contraintes a respecter dans notre jointure
              code_name: req.body[i].rep.substring(0,3),
              zip: req.body[i].cd,
            }
          },{ //jointure a la table reglettes
            model: reglettes,
            attributes: ["reglette_label"],
            required: true,
            where:{reglette_label: req.body[i].regletteType}
          },{ //jointure a la table options
            model: options,
            attributes: ["opt_label"],
            required: false,
          }],
          where: {reglette_nbr: req.body[i].regletteNbr},// contraintes a appliquer a la table tdps
        })
        if(result) results.push(result.dataValues);// on insert chaque resultat dans le tableau
      } catch (error) {throw(error)}

    }
    if (results.length<1) res.json([])
    else {// on retourne un tableau vide si pas de resultat a la requette et ce afin de respecter le format de reponse attendu par le front
      const reponse = results.map((result)=> {
        return{ //mise en forme de la reponse afin qu'elle respecte le format attendu par le front
          rep:result.repartiteur.code_name+result.repartiteur.zip,
          salle:result.salle,
          rco:result.rco,
          ferme:result.ferme,
          level:result.level,
          option: result.opt?result.opt.opt_label:null,
          cd:result.repartiteur.zip,
          regletteType:result.reglette.reglette_label,
          regletteNbr:result.reglette_nbr,
          tdpId:result.repartiteur.code_name+result.repartiteur.zip+result.reglette.reglette_label+result.reglette_nbr,
          _id:result.repartiteur.code_name+result.repartiteur.zip+result.reglette.reglette_label+result.reglette_nbr
        }
      })
      res.json(reponse);
    } 
  },

  async searchByPosition(req, res) {
    console.log("search by position request received", req.body);
  // la recherche par position permet de retrouver le tdp a partir de ses coordonnees dans une salle
  // si on connait les coordonnees on attend en retour le nom complet de la reglette (L/INX24)

    if (req.body.length < 1) return res.status(200).end("pas de tdp dans la demande"); //on verifie que la demande n'est pas null
    const results =[]; // un tableau pour stocker les resultats
    for (let i = 0; i < req.body.length; i++) { //on boucle dans le cas ou on a plusieurs rep dans la demande
      try {
        const result = await tdps.findOne({ //recheche tout dans la table tdps
          attributes: ["reglette_nbr"], // les champs que l'on souhaite en retour de la requette (SELECT en sql)
          include: [{ //jointure a la table repartiteurs (INNER JOIN en sql) oui car il faut qu'on connaisse l'id du rep concerné afin de construire la requette a la table tdps (foreign key)
            model: repartiteurs,
            required: true,
            where:{ // constraintes a respecter 
              code_name: req.body[i].rep.substring(0, 3),
              zip: parseInt(req.body[i].rep.substring(3,5)),
            }
          },{ // on inclus la table reglettes pour recuperer le champ "reglette_label"
            model: reglettes,
            attributes: ["reglette_label"],
            required: true,
          },{ // idem pour la table options
            model: options,
            attributes: ["opt_label"],
            required: false,
          }],
          where: { //ici on a les contraintes a respecter 
            salle: req.body[i].salle,
            rco: req.body[i].rco,
            ferme: req.body[i].ferme,
            level: req.body[i].level
          },
        });
        results.push(result);
      } catch (error) {throw(error)}
    }
    res.json(results);
  },

  async searchRep(req, res) {
    console.log("search by rep request received", req.body);
  // recherche un rep (ex: 'cho94') et nous retoune tous les elements de la table tdps qui appartiennes a ce rep
  // exemple de requette generee par searchRep:
  //SELECT "tdps"."id", "tdps"."reglette_nbr", "tdps"."salle", "tdps"."rco", "tdps"."ferme", "tdps"."level", "repartiteur"."id" AS "repartiteur.id", "repartiteur"."code_name" AS "repartiteur.code_name", "repartiteur"."long_name" AS "repartiteur.long_name", "repartiteur"."zip" AS "repartiteur.zip", "repartiteur"."nbr_salle" AS "repartiteur.nbr_salle", "repartiteur"."address" AS "repartiteur.address", "reglette"."id" AS "reglette.id", "reglette"."reglette_label" AS "reglette.reglette_label", "opt"."id" AS "opt.id", "opt"."opt_label" AS "opt.opt_label" FROM "tdps" AS "tdps" INNER JOIN "repartiteurs" AS "repartiteur" ON "tdps"."rep" = "repartiteur"."id" AND "repartiteur"."code_name" = 'cho' AND "repartiteur"."zip" = 94 INNER JOIN "reglettes" AS "reglette" ON "tdps"."reglette_type" = "reglette"."id" LEFT OUTER JOIN "opts" AS "opt" ON "tdps"."opts" = "opt"."id";

    if (req.body.length < 1)  res.status(200).end("pas de tdp dans la demande") //on verifie que la demande n'est pas null
    try {
      let result;
      for (let i = 0; i < req.body.length; i++) { //on boucle dans le cas ou on a plusieur rep dans la demande
        result = await tdps.findAll({ //recheche tout dans la table tdps
          attributes: ["reglette_nbr", "salle", "rco", "ferme", "level"], // les champs que l'on souhaite en retour de la requette (SELECT en sql)
          include: [{ //joint a la table repartiteurs (INNER JOIN en sql)
            model: repartiteurs,
            //attributes: ["code_name", "zip"], //on pourrait aussi demander de retourner certain champs de cette table
            required: true, 
            where:{ // on definie ici les contraintes de la requette a appliquer a cette table
              code_name: req.body[i].rep.substring(0, 3),
              zip: parseInt(req.body[i].rep.substring(3,5)),
            }
          },{
            model: reglettes,
            attributes: ["reglette_label"],
            required: true,
            //where:{reglette_label: req.body[i].regletteType}
          },{
            model: options,
            attributes: ["opt_label"],
            required: false,
          }],
        })
      }
      const reponse = result.map((result)=> { //mise en forme de la reponse afin qu'elle respecte le format attendu par le front
        return{
          rep:result.repartiteur.code_name+result.repartiteur.zip,
          salle:result.salle,
          rco:result.rco,
          ferme:result.ferme,
          level:result.level,
          option:result.opt?result.opt.opt_label=='INV'?'I':result.opt.opt_label:null,
          regletteType:result.reglette.reglette_label,
          regletteNbr:result.reglette_nbr,
          tdpId:result.repartiteur.code_name+result.repartiteur.zip+result.reglette.reglette_label+result.reglette_nbr,
          _id:result.repartiteur.code_name+result.repartiteur.zip+result.reglette.reglette_label+result.reglette_nbr
        }
      })
      //throw(reponse)
      res.json(reponse);// envoie de la reponse sous forme de json
    } 
    catch (error) {
      console.error("Erreur searchRep :", error);
      return res.status(200).json([]); 
    }
  },


  async create(req, res ) {
    console.log("create request received", req.body);
    //on va donc creer un nouvel element dans la table tdp
    const results = []
    for (let i = 0; i < req.body.length; i++) {//on boucle sur les elements à creer dans la requette req.body
      const tdp = req.body[i]

      //En premier on cherche dans la table repatiteur l'id correspondant a notre foreign Key dans la table tdp
      const rep_id = await repartiteurs //on lance la recherche de l'element dans la base
        .findOrCreate({
          attributes: ["id"], // les champs que l'on souhaite en retour de la requette
          where: { //les contraintes
            code_name: tdp.rep.substring(0, 3), //par exemple tdp.rep peut etre 'cho'
            zip: tdp.cd, // peut etre par exemple 94 
          }
        })
        .catch((error) => {
          console.error("Erreur create :", error);
          return res.status(200).json([]); 
        });

      //ensuite on recupere l'id de la reglette concernee
      const reg = await reglettes 
        .findOne({
          attributes: ["id"],
          where: {
            reglette_label: tdp.regletteType, //peut etre 'L/INX'
          },
        })
        .catch((error) => {
          console.error("Erreur create :", error);
          return res.status(200).json([]); 
        });

      // ensuite recup de l'id de l'option 
      opt = tdp.option=='I'?1:tdp.option=='TNI'?2:null
      
      // on peut maintenant essayer d'inserer une ligne dans la table tdps
      try {
        const result = await tdps.findOrCreate({ // on recherche d'abord si le tdp exist et si ce n'est pas le cas il sera creer
          where: {// avec ces contraintes la...
            rep: rep_id[0].dataValues.id, //valeur recuperee dans la table repartiteurs
            reglette_type: reg.dataValues.id, //valeur recuperee dans la table reglettes
            reglette_nbr: tdp.regletteNbr,
            salle: tdp.salle,
            rco: tdp.rco,
            ferme: tdp.ferme,
            level: tdp.level,
            opts: opt, 
          },
        })
        const {id,rep,reglette_type,reglette_nbr,salle,rco,ferme,level} = result[0].dataValues
        results.push({
          status:true,
          id:''+id+rep+reglette_type+reglette_nbr+salle+rco+ferme+level
        })
      } catch (error) { 
          console.error("Erreur create :", error);
          return res.status(200).json([]); 
      }
    }
    res.json(results)
  },



  async update(req, res) {
    console.log("update request received", req.body);
    for (let i = 0; i < req.body.length; i++) {//on boucle sur les elements à creer dans la requette req.body
      const tdp = req.body[i]
      try {
        const data = await reglettes.findOne({ where:{reglette_label : tdp.regletteType} })
        const optionValue = tdp.option == null?null:tdp.option =='I'?1:2
        const result = await tdps.findOne({ //recheche tout dans la table tdps 
          include: [{ //jointure a la table repartiteurs (INNER JOIN en sql) oui car il faut qu'on connaisse l'id du rep concerné afin de construire la requette a la table tdps (foreign key)
            model: repartiteurs,
            required: true,
            where:{ // ici les contraintes a respecter dans notre jointure
              code_name: tdp.rep.substring(0,3),
              zip: parseInt(tdp.rep.substring(3)),
            }
          }],
          where: {// contraintes a appliquer a la table tdps
            salle: tdp.salle,
            rco: tdp.rco,
            level:tdp.level,
            ferme:tdp.ferme
          },
        })
        result.set({
          reglette_type: data.dataValues.id , //valeur recuperee dans la table reglettes
          reglette_nbr: tdp.regletteNbr,
          opts: optionValue, //valeur recuperee dans la table options 
        })
        await result.save()
      } catch (error) {
          console.error("Erreur update :", error);
          return res.status(200).json([]);
      }
    }
    res.json(req.body)
  },
    

  updateid(req, res) {
    console.log("update id")
    res.status(200).end("Le backend repond!")
    /*
    tdp.find({}, function (err, arr) {
      if (err) {
        res.status(500).end(err);
      } else {
        const total = [...arr];
        total.forEach((tdp) => {
          const { rep, regletteType, regletteNbr } = tdp;
          const newValue = rep + regletteType + regletteNbr;
          tdp.tdpId = newValue;
        });
        //console.table(total)
        const results = [];
        const updateAll = (total) => {
          const doc = total.pop();
          //   tdp
          //     .updateOne({ _id: doc._id }, { $set: { ...doc } })
          //     .then((result) => {
          //       results.push(result);
          //       if (results.length < arr.length) updateAll();
          //       else res.status(200).json(results);
          //     })
          //     .catch((err) => throw(err));
        };
        if (total.length) updateAll(total);
        else res.status(200).json({ status: "nothing to update" });
      }
    });
    */
  },
  
  test(req, res) {
    res.status(200).end("maptdp-backend online.")
  },

  async delete(req, res) {
    console.log("req.body", req.body);
    for (let i = 0; i < req.body.length; i++) {//on boucle sur les elements à creer dans la requette req.body
      const tdp = req.body[i]
      try {
        const result = await tdps.findOne({ //recheche tout dans la table tdps 
          include: [{ //jointure a la table repartiteurs (INNER JOIN en sql) oui car il faut qu'on connaisse l'id du rep concerné afin de construire la requette a la table tdps (foreign key)
            model: repartiteurs,
            required: true,
            where:{ // ici les contraintes a respecter dans notre jointure
              code_name: tdp.rep.substring(0,3),
              zip: parseInt(tdp.rep.substring(3)),
            }
          },{
            model: reglettes,
            required:true,
            where:{
              reglette_label : tdp._id.substring(5,10)
            }
          }],
          where: {// contraintes a appliquer a la table tdps
            reglette_nbr: tdp._id.substring(10),
            salle: tdp.salle,
            rco: tdp.rco,
            level:tdp.level,
            ferme:tdp.ferme
          },
        })
        await result.destroy()
      } catch (error) {
          console.error("Erreur delete :", error);
          return res.status(200).json([]);
      }
    }
    res.status(200).json({ status: "nothing to delete" });
  },
};

module.exports = tdpController;
