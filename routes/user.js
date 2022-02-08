var express = require('express');
var router = express.Router();
const mysql = require( '../utill/mysql/connection' )
const userService = require( '../service/userService' )

router.get('/getuserinfo', async function( req, res, next ) {
  let conn
  let userInfo
  const userId = res.path.userId
  try {
    conn = await mysql.getConnection()
    userInfo = await userService.getUserInfo( conn, userId )
    res.status( 200 ).send( { code: 200, payload: userInfo } )
  }catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  }
} )

router.post('/signinuser', async function( req, res, next ) {
  let conn
  let userInfo
  const { userId, password } = req.body
  try {
    conn = await mysql.getConnection()
    userInfo = await userService.signInUser( conn, userId, password )
    res.status( 200 ).send( { code: 200, payload: userInfo } )
  }catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  }
} )

router.post('/signupuser', function( req, res, next ) {
  let conn
  const { user } = req.body
  try {
    conn = await mysql.getConnection()
    await userService.signUpUser( conn, user )
    res.status( 200 ).send( { code: 200, payload: { message: 'success' } } )
  }catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  }
} )

module.exports = router;
