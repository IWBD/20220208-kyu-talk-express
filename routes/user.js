var express = require('express');
var router = express.Router();
const mysql = require( '../utill/mysql/connection' )
const userService = require( '../service/userService' )

router.get('/getuserinfo', async function( req, res, next ) {
  let conn
  let userInfo
  const userId = req.path.userId
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
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally{
    if( conn ) {
      conn.release()
    }
  }
  res.end()
} )

router.post('/signupuser', async function( req, res, next ) {
  let conn
  const { user } = req.body

  if( user.password !== user.verificationPassword ) {
    res.status( 400 ).send( 'user went wrong' )
    return
  }

  try {
    conn = await mysql.getConnection()
    await userService.signUpUser( conn, user )
    res.status( 200 ).send( { code: 200, payload: { message: 'success' } } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    console.log( 'finally' )
    if( conn ) {
      conn.release()
    }
  }
} )

router.get('/checkduplication', async function( req, res, next ) {
  let conn
  const { userId } = req.query

  try {
    conn = await mysql.getConnection()
    const result = await userService.checkDuplication( conn, userId )
    res.status( 200 ).send( { code: 200, payload: result } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    if( conn ) {
      conn.release()
    }
  }
} )

module.exports = router;
