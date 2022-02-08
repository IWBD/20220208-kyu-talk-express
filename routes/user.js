var express = require('express');
var router = express.Router();

router.post('/signin', function( req, res, next ) {
  res.send('signin');
} )

router.post('/signup', function( req, res, next ) {
  res.send('signup');
} )

router.get('/getuserinfo', function( req, res, next ) {
  res.send('getuserinfo');
} )

module.exports = router;
