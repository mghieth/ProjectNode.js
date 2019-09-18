
const Joi=require('joi');
const express = require('express');
const router = express.Router();
const validate=require('../middleware/validate');
const {Rental}=require('../models/rental');
const {Movie}=require('../models/movie');
const auth=require('../middleware/async');


router.post('/',[auth,validate(validateReturn)],async (req,res,next)=>{
const rental=await Rental.lookup(req.body.customerId,req.body.movieId);

    if (!rental) return res.status(404).send('rental was not found.');
  
     if(rental.dataReturned) return res.status(400).send('Return already processed ');
        
        rental.return();
        await rental.save();
    
        await Movie.update({_id:rental.movieId._id},{
            $inc:{numberInStock}
        });
        
     return res.send(rental);

 
 });


 function validateReturn(req) {
    const schema = {
      customerId: Joi.objectId().required(),
      movieId: Joi.objectId().required(),
    };
  
    return Joi.validate(genre, schema);
  }

 module.exports=router;