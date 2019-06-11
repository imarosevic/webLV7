var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var methodOverride = require('method-override');
var User = require('../lib/user');

router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        
        var method = req.body._method
        delete req.body._method
        return method
      }
}))


router.use(function(req, res, next){
    if(req.user)
    {
	next();
    }
    else
    {
	res.redirect('/login');	
    }
});


router.get('/', function (req, res, next) {
    res.render('projects/index', {
        title: 'Projects'
    });
});

router.get('/list/leader', function (req, res, next) {

    
    mongoose.model('Project').find({voditelj_tima: req.user.id, arhiviran:false}, function (err, projects) {

    
    if (err) {
      return console.error(err);
    } else {
      
      res.format({
        html: function() {
          res.render('projects/list', {
            title: 'Projects you run',
            'projects': projects
          });
        },
        json: function() {
          res.json(projects);
        }
      });
    }
  });
});

router.get('/list/member', function (req, res, next) {

    
    mongoose.model('Project').find({clanovi_tima: req.user.id, arhiviran:false}, function (err, projects) {

    
    if (err) {
      return console.error(err);
    } else {
      // Vratimo pogled
      res.format({
        html: function() {
          res.render('projects/list', {
            title: 'Projects that you are member in',
            'projects': projects
          });
        },
        json: function() {
          res.json(projects);
        }
      });
    }
    });
});

router.get('/list/archive', function (req, res, next) {

    
    mongoose.model('Project').find({$or: [{voditelj_tima: req.user.id}, {clanovi_tima: req.user.id}], arhiviran:true}, function (err, projects) {

    
    if (err) {
      return console.error(err);
    } else {
      
      res.format({
        html: function() {
          res.render('projects/list', {
            title: 'Projects Archive',
            'projects': projects
          });
        },
        json: function() {
          res.json(projects);
        }
      });
    }
    });
});


router.get('/new', function(req, res) {
    res.render('projects/new', { title: 'New project' });
});


router.post('/', function(req, res) {

 
  var naziv = req.body.naziv;
  var opis = req.body.opis;
  var cijena = req.body.cijena;
  var obavljeni_poslovi = req.body.obavljeni_poslovi;
  var datum_pocetka = req.body.datum_pocetka;
  var datum_zavrsetka = req.body.datum_zavrsetka;


  mongoose.model('Project').create({

      naziv : naziv,
      opis : opis,
      cijena : cijena,
      obavljeni_poslovi : obavljeni_poslovi,
      datum_pocetka : datum_pocetka,
      datum_zavrsetka : datum_zavrsetka,
      voditelj_tima: req.user.id,
      arhiviran: false
  }, function (err, project) {
      if (err) {
          res.send("There was a problem adding the information to the database.");
      } else {
          
          res.format({
            html: function(){
                
                res.location("projects");
               
                res.redirect("/projects");
            },
            json: function(){
                res.json(project);
            }
        });
      }
  })
});



router.param('id', function(req, res, next, id) {

   
    mongoose.model('Project').findById(id, function (err, project) {
        
        if (err) {

          res.status(404)
          var err = new Error('Not Found');
          err.status = 404;
          res.format({
              html: function(){
                  next(err);
               },
              json: function(){
                     res.json({message : err.status  + ' ' + err});
               }
          });

        } else {
          
          req.id = id;
          next();
        }
    });
});


router.get('/:id', function(req, res) {

    mongoose.model('Project').findById(req.id).populate('voditelj_tima').populate('clanovi_tima').exec(function (err, project) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
	if(req.user.id == project.voditelj_tima.id || project.clanovi_tima.some(function(clan) { return clan.id == req.user.id }))
	{
	    res.format({
		html: function(){
		    res.render('projects/show', {
			"project" : project
		    });
		},
		json: function(){
		    res.json(project);
		}
	    });
	}
	else
	{
	    res.send("Nemate pravo pristupa ovome projektu.");
	}
    }
  });
});


router.route('/:id/edit')

  
	.get(function(req, res) {

	    mongoose.model('Project').findById(req.id, function (err, project) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {

		    // Pretvaranje datuma u čitkiji oblik
		    var datumpocetka = project.datum_pocetka.toISOString();
		    datumpocetka = datumpocetka.substring(0, datumpocetka.indexOf('T'));

		    var datumzavrsetka = project.datum_zavrsetka.toISOString();
		    datumzavrsetka = datumzavrsetka.substring(0, datumzavrsetka.indexOf('T'));
		    if(req.user.id == project.voditelj_tima)
		    {
			res.format({
			    //HTML response will render the 'edit.jade' template
			    html: function(){
				res.render('projects/edit', {
				    title: 'Project ' + project._id,
				    "project" : project,
				    "start date" : datumpocetka,
				    "end date" : datumzavrsetka
				});
			    },
			  
			    json: function(){
				res.json(project);
			    }
			});
		    }
		    else if( project.clanovi_tima.some(function(clan) { return clan == req.user.id }))
		    {
			res.format({
			    
			    html: function(){
				res.render('projects/edit_by_member', {
				    title: 'Project ' + project._id,
				    "project" : project,
				    "start date" : datumpocetka,
				    "end date" : datumzavrsetka
				});
			    },
			    
			    json: function(){
				res.json(project);
			    }
			});
		    }
		    else
		    {
			res.send("You dont have permission");
		    }
		    
		  
	        }
	    });
	})

    
    .put(function(req, res) {

	
	var naziv = req.body.naziv;
	var opis = req.body.opis;
	var cijena = req.body.cijena;
	var obavljeni_poslovi = req.body.obavljeni_poslovi;
	var datum_pocetka = req.body.datum_pocetka;
	var datum_zavrsetka = req.body.datum_zavrsetka;
	var arhiviran = req.body.arhiviran ? true : false;


	mongoose.model('Project').findById(req.id, function (err, project) {
	    if(req.user.id == project.voditelj_tima)
	    {
		
		project.update({

		    naziv : naziv,
		    opis : opis,
		    cijena : cijena,
		    obavljeni_poslovi : obavljeni_poslovi,
		    datum_pocetka : datum_pocetka,
		    datum_zavrsetka : datum_zavrsetka,
		    arhiviran: arhiviran

		}, function (err, projectID) {
		    if (err) {
			res.send("There was a problem updating the information to the database: " + err);
		    }
		    else {

			

			res.format({
			    html: function(){
				res.redirect("/projects/"+project._id);
			    },
			    json: function(){
				res.json(project);
			    }
			});
		    }
		})
	    }
	    else if(project.clanovi_tima.some(function(clan) { return clan == req.user.id }))
	    {
		
		project.update({
		    obavljeni_poslovi : obavljeni_poslovi,
		}, function (err, projectID) {
		    if (err) {
			res.send("There was a problem updating the information to the database: " + err);
		    }
		    else {
			
			
			
			res.format({
			    html: function(){
				res.redirect("/projects/"+project._id);
			    },
			    json: function(){
				res.json(project);
			    }
			});
		    }
		})
	    }
	    else
	    {
		res.send("Dont have permission");
	    }
	});
	
    })


    .delete(function (req, res){

	mongoose.model('Project').findById(req.id, function (err, project) {
	    if (err) {
	        return console.error(err);
	    }
	    else if((req.user.id != project.voditelj_tima))
	    {
		res.send("Dont have permission");
	    }
	    else
	    {
		
		
	        project.remove(function (err, project) {
	            if (err) {
	                return console.error(err);
	            } else {
			
			res.format({

                            html: function(){
				res.redirect("/projects");
                            },
                            json: function(){
				res.json({message : 'deleted',
					  item : project
					 });
                            }
			});
	            }
	        });
	    }
	});
    });


router.route('/:id/member')

    .get(function(req, res) {

        mongoose.model('Project').findById(req.id, function (err, project) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
		if(req.user.id == project.voditelj_tima)
		{
		    res.format({
			
			html: function(){
                            res.render('projects/member', {
				title: 'Add member to project ' + project._id,
				"project" : project
                            });
			},
			
			json: function(){
                            res.json(project);
			}
		    });
		}
		else
		{
		    res.send("Dont have permission.");
		}
            }
        });
    })

 
    .post(function(req, res) {
	
	var ime = req.body.ime;

	User.getByName(ime, function(err, user) {
	    if (err)
	    {
		res.send("There was a problem updating the information to the database: " + err);
	    }
	    else if(!user.id)
	    {
		res.send("User you tried to add does not exist.");
	    }
	    else
	    {
	
		mongoose.model('Project').findById(req.id, function (err, project) {
		    project.clanovi_tima.push(user.id);
		    project.save(function (err) {
			if (err) {
			    res.send("There was a problem updating the information to the database: " + err);
			}
			else if (req.user.id != project.voditelj_tima)
			{
			    res.send("You are not allowed to add user to the project.");
			}
			else {
			    
			    
			    res.format({
				html: function(){
				    res.redirect("/projects/"+project._id);
				},
				json: function(){
				    res.json(project);
				}
			    });
			}
		    });	
		});
	    }
	});
    });

module.exports = router;
