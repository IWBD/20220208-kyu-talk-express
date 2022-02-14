let express = require('express');
let router = express.Router();
const _ = require( 'lodash' )
const { pushMessage } = require( '../util/socket' )
const chattingService = require( '../service/chattingService' )
const mysql = require( '../util/mysql/connection' )

router.post('/makechttingroom', function( req, res, next ) {
  res.send('makechttingroom')
} )

router.post('/sendmessage', async function( req, res, next ) {
  let conn
  let { message, fromUserIdList } = req.body
  
  try {
    conn = await mysql.getConnection()
    const messageId = await chattingService.insertMessage( conn, message )

    const roomId = _.get( message, 'roomId' )

    let chattingRoom = await chattingService.getChattingRoom( conn, roomId )
    chattingRoom = _.get( chattingRoom, '0' ) || {}

    const fromUserList = _.map( fromUserIdList, userId => {
      return { messageId, userId }
    } )

    await chattingService.insertFromUser( conn, fromUserList )

    message = {
      ...message,
      messageId,
      isRead: null,
      notReadCount: fromUserIdList.length
    }

    res.status( 200 ).json( { code: 200, payload: messageId } )
    
    pushMessage( { message, chattingRoom }, fromUserIdList )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/readmessage', function( req, res, next ) {
  res.send('readmessage');
} )

module.exports = router;
