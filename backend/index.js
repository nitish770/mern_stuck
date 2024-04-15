const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require('jsonwebtoken');
const jwtkey = 'e-commerce';

const app = express();

app.use(express.json()); //midalware hi
app.use(cors());
//post api for singup page
app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject(); //hight password
  delete result.password  //hight password
  Jwt.sign({result}, jwtkey, {expiresIn:"2h"},(error,token)=>{
    if (error) {
      resp.send({result:"Somthing went wrong Please try some time after"});
    }
    resp.send({result, auth: token});
  })
});

//login api
app.post('/login',async(req,resp)=>{
  console.log(req.body);
  if (req.body.password && req.body.email) {
    let user =await  User.findOne(req.body).select("-password"); //remove password
    if (user) {
      Jwt.sign({user}, jwtkey, {expiresIn:"2h"},(error,token)=>{
        if (error) {
          resp.send({result:"Somthing went wrong Please try some time after"});
        }
        resp.send({user, auth: token});
      })
      
    }else{
      resp.send({result:"Please Correct Email"});
    }
  }else{
    resp.send({result:"Please Correct Your Email"});
  }
    
    
});

//add product
app.post('/add-product',verifyToken,async (req, resp)=>{
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

//product lists api
app.get('/products',verifyToken,async (req, resp)=>{
  let products =await Product.find(req.body);
  if (products.length > 0) {
    resp.send(products);
  }else{
    resp.send({result:"No Product Found"});
  }
  
});

//delete api
app.delete('/product/:id',verifyToken,async(req, resp)=>{
  const result =await Product.deleteOne({_id:req.params.id});
    resp.send(result);
  
});

//single product api
app.get('/product/:id',verifyToken,async(req, resp)=>{
  const result =await Product.findOne({_id:req.params.id});
    if (result) {
      resp.send(result);
    }else{
      resp.send({result:"result not found"});
    }
  
});

//update api
app.put('/product/:id',verifyToken,async(req, resp)=>{
  const result =await Product.updateOne(
    {_id:req.params.id},
    {
      $set : req.body
    });
    resp.send(result);
  
});

//search api
app.get('/search/:key',verifyToken,async(req, resp)=>{
  const result =await Product.find({
    "$or":[
      {name:{$regex:req.params.key}},
      {company:{$regex:req.params.key}},
      {category:{$regex:req.params.key}},
    ]
  });
    resp.send(result);
});

function verifyToken(req,resp,next) {
  let token = req.headers["authorization"]
  if (token) {
    token = token.split(" ")[1]
    console.log('middle ware call...',token)
    Jwt.verify(token,jwtkey,(err, valid)=>{
      if (err) {
        resp.status(401).send({result: "Please Provide Valid token"})
      }else{
        next();
      }
    })

  }else{
    resp.status(403).send({result: "Please add token width header"})
  }
  // console.log('middle ware call...',token);
  
}

app.listen(7000);
