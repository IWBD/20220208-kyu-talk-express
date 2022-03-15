var express = require('express');
var router = express.Router();
const _ = require( 'lodash' )
const mysql = require( '../util/mysql/connection' )
const userService = require( '../service/userService' )
const chattingService = require( '../service/chattingService' )

router.get('/getuserinfo', async function( req, res, next ) {
  let conn
  const userId = req.query.userId
  try {
    conn = await mysql.getConnection()

    const user = await userService.getUserInfo( conn, userId )
    const userRelationList = await userService.getUserRelationList( conn, userId )

    const messageList = await chattingService.getMessageListByUserId( conn, userId )

    const roomIdList = _( messageList )
      .filter( 'roomId' )
      .map( 'roomId' )
      .uniqBy()
      .value()

    let chattingRoomList = await chattingService.getChattingRoomByRoomId( conn, roomIdList )

    const userChattingRoomList = await chattingService.getChattingRoomByUserId( conn, userId )
    
    chattingRoomList = _( chattingRoomList || [] )
      .concat( userChattingRoomList )
      .uniqBy( 'roomId' )
      .value()

    res.status( 200 ).send( { code: 200, payload: { user, userRelationList, chattingRoomList, messageList } } )
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
    await userService.login( conn, userId, password )
    res.status( 200 ).send( { code: 200 } )
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

router.get('/searchuser', async function( req, res, next ) {
  let conn
  const { userId, searchWord } = req.query

  try {
    conn = await mysql.getConnection()
    const result = await userService.searchUser( conn, userId, searchWord )
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

router.post( '/addfriend', async function( req, res, next ) {
  let conn
  const { userId, targetUserId } = req.body

  try {
    conn = await mysql.getConnection()
    const isFriend = 1
    const isBlock = null
    const update = true
    const userRelation = await userService.addUserRelation( conn, userId, [targetUserId], isFriend, isBlock, update )
    res.status( 200 ).send( { code: 200, payload: userRelation[0] } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

module.exports = router;
