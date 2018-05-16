var middlewareObj = {};

middlewareObj.checkCurrentUser = function(req, res, next){
  if(req.cookies["user_id"] === undefined){
    res.redirect("/urls")
  } else {
    next();
  }
}

module.exports = middlewareObj;
