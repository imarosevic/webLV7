var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var User = require('../lib/user');

//var methodOverride = require('method-override');


router.get('/', function(req,res,next){
    res.render('register',{ title:'Register'});
});


router.post('/', function(req,res,next){
    User.getByName(req.body.name,function(err,user){
	if(err) return next(err);
	
	if(user.id) {
	    res.send("User with that username already exist!");
	} else {
	    
	    user= new User({
		name:req.body.name,
		pass:req.body.pass
	    });
	    
	    user.save(function(err){
		if(err) return next(err);
		res.redirect('/');
	    });
	}
    });
});

module.exports = router;
