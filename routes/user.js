var express = require('express');
var router = express.Router();
const mysql = require( '../utill/mysql/connection' )
const userService = require( '../service/userService' )
const chattingService = require( '../service/chattingService' )


router.get('/getuserinfo', async function( req, res, next ) {
  let conn
  const userId = req.query.userId
  try {
    conn = await mysql.getConnection()
    
    const { user, friendList } = await userService.getUserInfo( conn, userId )
    const chattingRoomList = await chattingService.getChattingRoom( conn, userId )
    const messageList = await chattingService.getMessageList( conn, userId )

    res.status( 200 ).send( { code: 200, payload: { user, friendList, chattingRoomList, messageList } } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/login', async function( req, res, next ) {
  let conn
  const { userId, password } = req.body

  try {
    conn = await mysql.getConnection()
    const userInfo = await userService.login( conn, userId, password )
    res.status( 200 ).send( { code: 200, payload: userInfo } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
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
    conn && conn.release()
  }
} )

router.get('/checkduplication', async function( req, res, next ) {
  let conn
  const { userId } = req.query

  try {
    conn = await mysql.getConnection()
    const result = await userService.checkUserDuplication( conn, userId )
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
