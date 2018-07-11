var express = require('express'),
app = express(),
cors = require('cors'),
mongoose = require('mongoose'),
body_parse = require('body-parser'),
jwt =  require('jsonwebtoken');

app.use(cors({
    origin:"http://localhost:4200"
}));

app.use(body_parse.urlencoded({extended:false}));
app.use(body_parse.json());

var db = mongoose.connection;
mongoose.connect('mongodb://localhost:27017/posts', { useNewUrlParser: true });

db.on('error', function(err){
    console.error("connection error;", err);
});

db.on('open',function(){
    console.log('connection db');
});

app.listen(3000, function(){
    console.log("server is @ localhost:3000");
});

var registration_schema = mongoose.Schema({
    firstname: String,
    lastname : String,
    email: String,
    password: String,
    phonenumber: String,
});
var create_schema = mongoose.Schema({
    title: String,
    description : String,
    isLike : Number,
    username : String
});
var createComment_schema = mongoose.Schema({
    comment: String,
    post_id : String,
    username : String
});

var registration_model = mongoose.model('userdata', registration_schema);
var create_model = mongoose.model('postdata', create_schema);
var createComment_model = mongoose.model('commentdata', createComment_schema);


app.post('/login',function(req,res){
    // console.log(req.body); 
    
    registration_model.find({$and:[{"email":req.body.email} ,{"password": req.body.password }]},function(err,doc){
        if(!err && doc.length == 1)
        {
            var token = jwt.sign({"username":doc["firstname"]}, 'my-secret-Key', {
                expiresIn : '1h'
            });
            res.send({
                isloggedIn : true,
                token : token
               });      
        } 
        else
        {
            // console.log("helllow1");
            res.send({
                isloggedIn : false
               });  
        }
      
    });
});
app.post('/registration',function(req,res){
    // console.log("value");
    // console.log(req.body);
    registration_model.find({"email":req.body.email},function(err,doc){
         if(doc.length != 0)
         {
                    res.send(false);
         }
         else{
            // console.log(req.body);
            var registration_doc = registration_model(req.body);
            registration_doc.save(function(err){
                    if(!err)
                    {
                        // console.log("value");
                        res.send(true);
                    }
                });     
         }
    });
});

app.use(function(req, res, next){
    // console.log(req.headers['authtoken']);
    var token = req.body.authtoken || req.query.authtoken || req.headers['authtoken'];
    jwt.verify(token, 'my-secret-Key', function(err, decoded){
            if(err)
            {   
                // console.log("hellow");
                    res.send({
                            err : true,
                            msg : 'invalide request'
                    })
            }
            else
            {
                // console.log("hellow1");
                  req.decoded = decoded; // if you want to know which user login this method can be use
                   next();
            }
    });     
});

app.post('/createPost',function(req,res){
    req.body["isLike"] = 0;
    req.body["username"] = req.decoded["username"];

            // console.log(req.body);
            var createpost_doc = create_model(req.body);
            createpost_doc.save(function(err){
                    if(!err)
                    {
                        //  console.log("value");
                        res.send(true);
                    }
                });     
});

app.get('/getPost',function(req,res){
    // console.log(req.decoded["email"]);
    create_model.find({"username":req.decoded["username"]},function(err,doc){
    //   console.log(doc);
      
        if(doc.length >= 1)
        {
            res.send({
                isPost : true,
                doc : doc
               });      
        } 
        else
        {
            // console.log("helllow1");
            res.send({
                isPost : false
               });  
        }
      
    });
    
});

app.post('/deletePost', function(req,res){
    //  console.log(req.body["_id"]);
    create_model.remove({"_id": mongoose.Types.ObjectId(req.body["_id"])},function(err,doc){
        // console.log(err);
        if(!err)
        {
            createComment_model.remove({"post_id": mongoose.Types.ObjectId(req.body["_id"])},function(err,doc){
                    if(!err)
                    {
                        res.send({
                            isDelete : true
                         }); 
                    }
                });
        } 
        else
        {
            // console.log("helllow1");
            res.send({
                isDelete : false
               });  
        }
      
    }); 
});

app.post('/likePost', function(req,res){
    //  console.log(req.body);
    var count = req.body['isLike'];
    count +=1;
    // console.log(count);
    create_model.update({"_id": mongoose.Types.ObjectId(req.body["_id"])}, { $set: {'isLike': count} }
    ,function(err,doc){
        if(!err)
        {
            res.send({
                liked : true
            });
        }
        else
        {
            res.send({
                liked : false
            });
        }
    });
});

app.post('/addCommnet', function(req,res){
    req.body["username"]  = req.decoded["username"];
    // console.log(req.body);
    var creatComment_doc = createComment_model(req.body);
        creatComment_doc.save(function(err){
                    if(!err)
                    {
                        res.send(true);
                    }
                });     
});

app.post('/getComment', function(req,res){
    req.body["username"]  = req.decoded["username"];
    // console.log(req.body);
    createComment_model.find({$and:[{"username": req.body["username"], "post_id" : req.body["_id"]}]},function(err,doc){
        if(!err)
        {
                res.send({
                        isSuccess : true,
                        doc : doc
                });
        }   
        else
        {
            res.send({
                isSuccess : false,
        });
        }
    });
});
