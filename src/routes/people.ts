import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Error } from 'mongoose';
import { Person } from '../models/person';
import { RequestValidationError } from '../errors/request-validation-error';
import { DatabaseConnectionError } from '../errors/database-connection-error';
const router = express.Router();
// class User 
// {
//   name: string,
//   email: string,
//   phone: number,
//   addresses:[{
//     label:String,
//     addressLine:String,
//     street:String, 
//     city:String   
//   }]
// }
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

//pagination People --   todo
router.get('/people/:offset/:limit', (req, res) => {
  console.log("list all people")
  console.log(req.params.offset);
  console.log(req.params.limit);
  try{
    Person.find()
    .then(posts => {
      res.status(200).send(posts);
    });
  }
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
});

//get Person ---Get People   
router.get('/people/:email', (req, res) => {
  console.log("get Person")
  try{
    Person.find({email:req.params.email , isDeleted : false}) //list only people who are not deleted
    .then(people => {
      if(people.length > 0 )
      {
        let person = people[0];
        let links = [];
        let linkObj = {
          "href" : "/people/" + person.email,
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
router.put( "/people/name", async ( req, res ) => {
  console.log("put ",req.body )
  try
  {
   await Person.findOneAndUpdate({email:req.body.email}, {$set:{name: req.body.name}});
   res.status(201).send("Person");
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
    
} );



//Update Person --Put Person   (/peron)
router.put( "/people/address", async ( req, res ) => {
  console.log("put ",req.body )
  try
  {
   await Person.findOneAndUpdate({email:req.body.email}, {$addToSet:{addresses:
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

//delete person wih emmail as parameter
router.delete( "/people/:email", async ( req, res ) => {
  console.log("delete person",req.params.email )
   try
  {

    const filter = {email: req.params.email}
    const update = {isDeleted:true};
    let result = await Person.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      rawResult: true // Return the raw result from the MongoDB driver
    });
    
    let retObject = [];
    retObject.push(result.value);
    let undoLink;
    if(result.value != null)
    {
      undoLink = "/undo_delete/"  + result.value.name;
    }
    retObject.push(undoLink);
    res.status(204).send(retObject);
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
} );
//Undo Delete person             (/undopesron)
router.patch( '/people/:email', async ( req, res ) => {
  console.log("undelete",req.params.email )
  try
  {

    const filter = {email: req.params.email}
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

//delete person wih emmail as parameter
router.delete( "/people/:email", async ( req, res ) => {
  console.log("delete person",req.params.email )
   try
  {

    const filter = {email: req.params.email}
    const update = {isDeleted:true};
    let result = await Person.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      rawResult: true // Return the raw result from the MongoDB driver
    });
  
    let retObject = [];
    retObject.push(result.value);
    let undoLink;
    if(result.value != null)
    {
      undoLink = "/undo_delete/"  + result.value.name;
    }
    retObject.push(undoLink);
    res.status(402).send(retObject);
  } 
  catch (err:any) {
    console.error(err);
    throw new DatabaseConnectionError();
  }
} );

export { router };

//Delete Person --Delete Person (/person)
// router.delete( "/person/:email", async ( req, res ) => {
//   console.log("delete ",req.params.email )
//   try {
//     // Remove Person
//     await Person.findOneAndRemove({ email: req.params.email });
  
//     res.status(204).json({ msg: "User removed" });
//   } catch (err:any) {
//     console.error(err);
//     res.status(501).send("Internal Server Error");
//   }
// } );
// router.delete( "/people", async ( req, res ) => {
//   console.log("delete ")
//   try {
//     // Remove Person
//     const query = {isDeleted:true};;
//     const result = await Person.deleteMany(query);
//     res.status(204).send("Deleted " + result.deletedCount + " documents");
//   } catch (err:any) {
//     console.error(err);
//     res.status(501).send("Server Error");
//   }
// } );


// Create people directory API

// Person should have basic profile data, contact data with multiple addresses, phone numbers, emails etc

// List people, Create person, update person, delete person API

// Bonus points bulk delete people, ability to undo delete

// Use whatever database you like

// Use whatever backend framework you like, expressjs or nestjs etc

// Use whatever API style you like REST/GraphQL

///URLS 
//list People ---Get People   (/People) -done
//Create Person --Post  Person (/person) -partially done
//Update Person --Put Person   (/peron) -partially done
//Delete Person --Delete Person (/person) --partially done
//Bulk Delete People            (/people) -partially done
//Undo Delete person             (/undoeletepeople) -partially done
//Undo Delete People           (/undodeletepeople) (optional)

