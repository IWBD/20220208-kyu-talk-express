const _ = require( 'lodash' )
const chattingService = require( '../service/chattingService' )
const mysql = require( '../util/mysql/connection' )

// CREATE TABLE message (
//   message_id INT(10) AUTO_INCREMENT PRIMARY KEY NOT NULL,
//   room_id INT(10),
//   send_user_id VARCHAR(15) NOT NULL,
//   text VARCHAR(255) NOT NULL,
//   create_date BIGINT NOT NULL,
//   modify_date BIGINT
// );

// CREATE TABLE from_user (
//   message_id INT(10) NOT NULL,
//   user_id VARCHAR(255) NOT NULL,
//   is_read BIGINT
// );



module.exports = {
  message: async function( redisClient, socket, messageParams ) {
    let conn 
    const { message, fromUserIdList } = messageParams
    try {
      conn = await mysql.getConnection()
      const messageId = await chattingService.insertMessage( conn, message )
      
      const fromUserList = _.map( fromUserIdList, userId => {
        return { messageId, userId }
      } )
      
      await chattingService.insertFromUser( conn, fromUserList )

      let socketIdList = []
      
      for( let i = 0; i < fromUserIdList.length; i++ ) {
        const socketId = await redisClient.get( fromUserIdList[i] )
        socketId && socketIdList.push( socketId )
      }

      for( let i = 0; i < socketIdList.length; i++ ) {
        const sendMessage = {
          ...message,
          messageId,
          isRead: null,
          notReadCount: fromUserIdList.length
        }
        socket.to( socketIdList[i] ).emit( 'message', sendMessage )
      }
    } catch( err ) {
      console.error( err )
    } finally {
      conn && conn.release()
    }
  },
  readMessage: async function( redisClient, socket, messageList ) {
    
  }
}