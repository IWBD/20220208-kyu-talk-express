let express = require('express');
let router = express.Router();
const _ = require( 'lodash' )
const { pushClient } = require( '../util/socket' )
const chattingService = require( '../service/chattingService' )
const userService = require( '../service/userService' )
const mysql = require( '../util/mysql/connection' )

router.post('/makechttingroom', function( req, res, next ) {
  res.send('makechttingroom')
} )

router.post('/sendmessage', async function( req, res, next ) {
  let conn
  let { message, fromUserIdList } = req.body
  
  try {
    conn = await mysql.getConnection()
    
    const messageId = await chattingService.addMessage( conn, message )
    
    let chattingRoom = null

    const roomId = _.get( message, 'roomId' )
    if( roomId ) {
      chattingRoom = await chattingService.getChattingRoomByRoomId( conn, [ roomId ] )
      chattingRoom = _.get( chattingRoom, '0' ) || {}
      fromUserIdList = _.map( chattingRoom.roomUser, 'userId' )
    } 

    fromUserIdList = _.filter( fromUserIdList,  userId => message.sendUserId !== userId  )
    
    await chattingService.addFromUser( conn, messageId, fromUserIdList )

    message = await chattingService.getMessage( conn, messageId )

    res.status( 200 ).json( { code: 200, payload: { message, chattingRoom } } )

    const pushMessageList = _.map( fromUserIdList, fromUserId => {
      return {
        userId: fromUserId,
        params: { chattingRoom, message }
      }
    } )
    
    pushClient( 'message', pushMessageList )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/readmessage', async function( req, res, next ) {
  const { messageList, userId } = req.body

  let conn 
  try {
    if( !userId || _.isEmpty( messageList || [] ) ) {
      throw new Error( 'params error' )
    }

    conn = await mysql.getConnection()
    
    const messageIdList = _.map( messageList, 'messageId' )
    await chattingService.readMessage( conn, userId, messageIdList )
    
    let fromUserIdList
    if( messageList[0].roomId ) {
      let chattingRoom = await chattingService.getChattingRoomByRoomId( conn, [ messageList[0].roomId ] )
      fromUserIdList = _.get( chattingRoom, '0.roomUser' )
      fromUserIdList = _.map( fromUserIdList, 'userId' )
    } else {
      fromUserIdList = _.map( messageList[0].fromUserList, 'userId' )
      fromUserIdList.push( messageList[0].sendUserId )
    }
    
    const pushReadList = _.map( fromUserIdList, fromUserId => {
      return {
        userId: fromUserId,
        params: { messageIdList, userId }
      }
    } )

    pushClient( 'readMessage', pushReadList )
    
    res.status( 200 ).json( { code: 200 } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/addchattingroom', async function( req, res ) {
  let conn
  let { createUserId, roomUser } = req.body
  
  try {
    roomUser = _.isArray( roomUser ) ? roomUser : []
    if( !createUserId || _.isEmpty( roomUser ) ) {
      throw new Error( 'params error' )
    } 

    conn = await mysql.getConnection()

    const roomId = await chattingService.addChattingRoom( conn, createUserId, roomUser )

    const chattingRoomList = await chattingService.getChattingRoomByRoomId( conn, [ roomId ] )

    res.status( 200 ).json( { code: 200, payload: chattingRoomList[0] } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

module.exports = router;
