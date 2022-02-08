let express = require('express');
let router = express.Router();

router.post('/makechttingroom', function( req, res, next ) {
  res.send('makechttingroom')
} )

router.post('/sendmessage', function( req, res, next ) {
  res.send('sendmessage')
} )

router.post('/readmessage', function( req, res, next ) {
  res.send('readmessage');
} )

module.exports = router;
