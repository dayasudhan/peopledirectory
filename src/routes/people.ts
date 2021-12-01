import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Error } from 'mongoose';
import { Person } from '../models/person';
import { RequestValidationError } from '../errors/request-validation-error';
import { DatabaseConnectionError } from '../errors/database-connection-error';
const router = express.Router();

//list People ---Get all People   
router.get('/people', (req, res) => {
  console.log("list all people")
  try{
    Person.find({ isDeleted : false}) //list only people who are not deleted
    .then(posts => {
      res.status(200).send(posts);
    });
  }
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
});

//get Person ---Get People  based on id 
router.get('/people/:id', (req, res) => {
  console.log("get Person")
  try{
    Person.find({_id:req.params.id , isDeleted : false}) //list only people who are not deleted
    .then(people => {
      if(people.length > 0 )
      {
        let person = people[0];
        let links = [];
        let linkObj = {
          "href" : "/people/" + person._id,
          "rel" : "self"
        };
        links.push(linkObj);
   
        let retObject = {
          "id" : person._id,
          "email" : person.email,
          "name": person.name,
          "phone": person.phone,
          "addresses": person.addresses,
          "links" : links
        };
        res.status(200).send(retObject);
      }
      else
      {
        res.status(200).send(people[0]);
      }
    });
  }
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
});

//Create Person --
router.post( "/people",[
  body('email')
    .isEmail()
    .withMessage('Email must be valid'),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number should contains 10 digits')
  ],   
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    let input = req.body;
    input.isDeleted = false;//intitalize with  status  --this to use undo delete
    console.log(input);
    try{
      const person = Person.build(input);
      await person.save();
      //create link to open this object
      let links = [];
      let linkObj = {
        "href" : "/people/" + person.email,
        "rel" : "self"
      };
      links.push(linkObj);
      let retObject = {
        "id" : person._id,
        "email" : person.email,
        "links" : links
      };
      res.status(201).send(retObject);
    }
    catch (err:any) {
      console.error(err);
      throw new DatabaseConnectionError();
    }
  });

  //Update Person --Put Person   (/peron)
router.put( "/people/:id",
  async (req: Request, res: Response) => {
  console.log("put ",req.body )
  try
  {
   await Person.findOneAndUpdate({_id:req.params.id}, {$addToSet:{addresses:
    {$each:[
      {"label":req.body.address.label ,
        "addressLine":req.body.address.addressLine ,
        "street":req.body.address.street ,
        "city":req.body.address.city }]}}});
     res.status(200).send("Address updated");
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
    
} );



//Bulk Delete People            (/people) 
router.delete( "/people", async ( req, res ) => {
  console.log("delete ")
  try {
    // Remove Person
    const filter = {} //to all 
    const query = {isDeleted:true};;
    const result = await Person.updateMany(filter,query);
    res.status(204).send("Deleted documents");
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
} );

//Undo Bulk Delete People            (/people) 
router.patch( "/people", async ( req, res ) => {
  console.log("un delete ")
  try {
    // Remove Person
    const filter = {} //to all 
    const query = {isDeleted:false};;
    const result = await Person.updateMany(filter,query);
    res.status(204).send("undelete documents");
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
} );

//delete person wih id as parameter
router.delete( "/people/:id", async ( req, res ) => {
  console.log("delete person",req.params.id )
  try
  {

    const filter = {_id: req.params.id}
    const update = {isDeleted:true};
    let result = await Person.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      rawResult: true // Return the raw result from the MongoDB driver
    });
    res.status(204).send("delete successfully");
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
} );
//Undo Delete person             (/undopesron)
router.patch( '/people/:id', async ( req, res ) => {
  console.log("undelete",req.params.id )
  try
  {

    const filter = {_id: req.params.id}
    const update = {isDeleted:false};
    let result = await Person.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      rawResult: true // Return the raw result from the MongoDB driver
    });
    console.log("undoDelete done");
    res.status(201).send("undoDelete");
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
} );

export { router };
