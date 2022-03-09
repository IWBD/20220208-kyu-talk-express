let express = require('express');
let router = express.Router();
const _ = require( 'lodash' )
const { pushMessage } = require( '../util/socket' )
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

    const roomId = _.get( message, 'roomId' )

    let chattingRoom = null
    if( roomId ) {
      chattingRoom = await chattingService.getChattingRoom( conn, [ roomId ] )
      chattingRoom = _.get( chattingRoom, '0' ) || {}
      try {
        fromUserIdList = JSON.parse( chattingRoom.roomUser )
        _.remove( fromUserIdList, message.sendUserId )
      } catch( err ) {
        throw err
      } 
    }
    
    const fromUserList = _.map( fromUserIdList, userId => {
      return { messageId, userId }
    } )

    await chattingService.insertFromUser( conn, fromUserList )
    const userRelationList = await userService.addUserRelation( conn, message.sendUserId, fromUserIdList )

    if( !roomId ) {
      message.fromUserId = fromUserIdList[0]
    }

    message.messageId = messageId 

    res.status( 200 ).json( { code: 200, payload: { message, chattingRoom, userRelationList } } )

    message = {
      ...message,
      messageId,
      isRead: null,
      fromUserId: null,
      notReadCount: fromUserIdList.length
    }

    const userRelationMap = {}
    for( let i = 0; i < fromUserIdList.length; i++ ) {
      try {
        const userRelation = await userService.addUserRelation( conn, fromUserIdList[i], [ message.sendUserId ] )[0]
        userRelationMap[fromUserIdList[i]] = userRelation 
      } catch( err ) {
        console.error( err )
      }
    }
    
    const pushMessageList = _.map( fromUserIdList, fromUserId => {
      const sendMessage = { ...message, fromUserId }
      return {
        fromUserId,
        chattingRoom,
        message: sendMessage,
        userRelation: userRelationMap[fromUserId] || null,
      }
    } )
    
    pushMessage( pushMessageList )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/readmessage', async function( req, res, next ) {
  res.send('readmessage');
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

    const chattingRoom = await chattingService.addChattingRoom( conn, createUserId, roomUser )
    const roomUser = await userService.getUserList( conn, userIdList )
    chattingRoom.roomUser = roomUser

    res.status( 200 ).json( { code: 200, payload: chattingRoom } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

module.exports = router;
