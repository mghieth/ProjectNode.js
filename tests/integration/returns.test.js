const moment=require('moment');
const request=require('supertest');
const {Rental}=require('../../models/rental');
const {Movie}=require('../../models/movie');
const {User}=require('../../models/users');
const mongoose=require('mongoose');


describe('/api/returns',()=>{
    let server;
    let customerId;
    let movieId;
    let rental;
    let movie;
    let token;

    const exec = ()=>{
        return  request(server)
        .post('/api/returns')
        .set('x-auth-token',token)
        .send({customerId,movieId});
    };


    beforeEach(async()=>{
        jest.setTimeout(3000)
      server=require('../../index');
      customerId=mongoose.Types.ObjectId();
      movieId=mongoose.Types.ObjectId();
      token=new User().generateAuthToken();

        movie=new Movie({
            _id:movieId,
            title:'12345',
            dailyRentalRate:2,
            genre:{name:'12345'},
            numberInStock:10
        });
       await movie.save();
       rental=new Rental({
          customer:{
              _id:customerId,
              name:'12345',
              phone:'123456'
          },
          movie:{
              _id:movieId,
              title:'12345',
              dailyRentalRate:2
          }
        });
        await rental.save();
});


    afterEach(async ()=>{
        await server.close();
         await Rental.remove({});
         await Movie.remove({});
    });

    it('should return 401 if client is not logged in', async () => {
       token='';

        const res=await exec();

       expect(res.status).toBe(401);

    });

      it('should return 400 if the customerId not provided', async () => {
      customerId='';
      //delete payload.customerId;
       
        const res=await exec();

       expect(res.status).toBe(400);
    });

     it('should return 400 if the movieId not provided',async()=>{
        movieId='';
        
         const res=await exec();
 
        expect(res.status).toBe(400);
     });

     it('should return 404 if no renta found for this customer/movie ',async()=>{
        await Rental.remove({});
       
         const res=await exec();
 
        expect(res.status).toBe(404);
     });

     it('should return 400 if rental already processed ',async()=>{
        rental.dateReturned=new Date();
       await rental.save();

         const res=await exec();
 
        expect(res.status).toBe(400);
     });

     it('should return 200 if we have a valid request',async()=>{

         const res=await exec();
 
        expect(res.status).toBe(200);
     });

     it('should return set the returnDate if input is valid',async()=>{
       const res=await exec();

        const rentaInDB=await Rental.findById(rental._id);
        const diff=new Date() -rentaInDB.dateReturned;
        expect(diff).toBeLessThan(10 * 1000);
    });
     it('should return set the rentalFee if input is valid',async()=>{
        rental.dateOut=moment().add(-7,'days').toDate();
        await rental.save();


        const res=await exec();
        
         const rentaInDB=await Rental.findById(rental._id);
         expect(rentaInDB.rentalFee).toBe(14);
     });

     it('should increase the stock if input is valid',async()=>{
        

        const res=await exec();
        
         const movieINDB=await Movie.findById(movieId);
         expect(movieINDB.numberInStock).toBe(movie.numberInStock + 1);
     });

     it('should increase the stock if input is valid',async()=>{
        const res=await exec();
        
        const rentalInDB=await Rental.findById(rental._id);

         expect(Object.keys(res.body)).toEqual(
             expect.arrayContaining(['dateOut','dataReturned','rentalFee',
            'customer','movie']));


     
     });
});

