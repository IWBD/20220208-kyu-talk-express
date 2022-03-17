const _ = require( 'lodash' )
const { connParamsAsPothole } = require('../../util/common')
const common = require( '../../util/common' )
const userService = require( '../userService' )

module.exports = {
  getChattingRoomByRoomId: async function( conn, roomIdList ) {
    const s = _.replace( sql.seletCattingRoom, '{{roomIdList}}', _.join( roomIdList, ', ' ) )

    let chattingRoomList = await common.connPromise( conn, s )
    chattingRoomList = common.connResultsAsCamelCase( chattingRoomList )

    _.forEach( chattingRoomList, chattingRoom => {
      try {
        chattingRoom.roomUser = JSON.parse( chattingRoom.roomUser )
      } catch( err ) {
        console.error( err, chattingRoom )
      }
    } )
    
    if( chattingRoomList.length > 0 ) {
      const userIdList = _( chattingRoomList )
        .map( 'roomUser' )
        .flatten()
        .compact()
        .uniq()
        .value()
  
      const userList = await userService.getUserListByUserId( conn, userIdList )
      const userMap = _.keyBy( userList, 'userId' )
      
      _.forEach( chattingRoomList, chattingRoom => {
        chattingRoom.roomUser = _.map( chattingRoom.roomUser, userId => _.get( userMap, userId ) || null ) 
      } )
    }

    return chattingRoomList
  },
  getChattingRoomByUserId: async function( conn, userId ) {
    let chattingRoomList = await common.connPromise( conn, sql.seletUserCattingRoom, [ userId ] )
    chattingRoomList = common.connResultsAsCamelCase( chattingRoomList )

    _.forEach( chattingRoomList, chattingRoom => {
      try {
        chattingRoom.roomUser = JSON.parse( chattingRoom.roomUser )
      } catch( err ) {
        console.error( err, chattingRoom )
      }
    } )

    if( chattingRoomList.length > 0 ) {
      const userIdList = _( chattingRoomList )
        .map( 'roomUser' )
        .flatten()
        .compact()
        .uniq()
        .value()
  
      const userList = await userService.getUserListByUserId( conn, userIdList )
      const userMap = _.keyBy( userList, 'userId' )
      
      _.forEach( chattingRoomList, chattingRoom => {
        chattingRoom.roomUser = _.map( chattingRoom.roomUser, userId => _.get( userMap, userId ) || null )
      } )
    }

    return chattingRoomList
  },
  getMessageListByUserId: async function( conn, userId ) {
    let res = await common.connPromise( conn, sql.selectUserMessage, [ userId ] )
    sendMessageList = common.connResultsAsCamelCase( res )
    
    res = await common.connPromise( conn, sql.selectFromMessage, [ userId ] )
    fromMessageList = common.connResultsAsCamelCase( res )

    let messageList = _.concat( sendMessageList, fromMessageList )

    const fromUserIdList = _( messageList )
      .map( ( { sendUserId, fromUserId } ) => [ sendUserId, fromUserId ] )
      .flatten()
      .uniq()
      .value() 
    
    const userList = await userService.getUserListByUserId( conn, fromUserIdList )
    const userMap = _.keyBy( userList, 'userId' ) 

    messageList = _( sendMessageList )
      .concat( fromMessageList )
      .groupBy( 'messageId' )
      .map( ( messageList, messageId ) => {
        if( messageId === 364 ) {
          console.log( messageList )
        }
        const message = messageList[0]
        const fromUserList = _.map( messageList, ( { fromUserId, isRead } ) => {
          return {
            isRead,
            userId: fromUserId,
            name: _.get( userMap, `${fromUserId}.name` )
          }
        } ) 
        return {
          messageId: message.messageId,
          roomId: message.roomId,
          sendUserId: message.sendUserId,
          sendUserName: _.get( userMap, `${message.sendUserId}.name` ),
          createDate: message.createDate,
          text: message.text,
          fromUserList
        }
      } )
      .value()

    return messageList
  },
  getMessage: async function( conn, messageId ) {
    let res = await common.connPromise( conn, sql.selectMessage, [ messageId ] )
    let messageList = common.connResultsAsCamelCase( res )

    const fromUserIdList = _( messageList )
      .map( ( { sendUserId, fromUserId } ) => [ sendUserId, fromUserId ] )
      .flatten()
      .uniq()
      .value() 
    
    const userList = await userService.getUserListByUserId( conn, fromUserIdList )
    const userMap = _.keyBy( userList, 'userId' ) 

    messageList = _( messageList )
      .groupBy( 'messageId' )
      .map( messageList => {
        const message = messageList[0]
        const fromUserList = _.map( messageList, ( { fromUserId, isRead } ) => {
          return {
            isRead,
            userId: fromUserId,
            name: _.get( userMap, `${fromUserId}.name` )
          }
        } ) 
        return {
          messageId: message.messageId,
          roomId: message.roomId,
          sendUserId: message.sendUserId,
          sendUserName: _.get( userMap, `${message.sendUserId}.name` ),
          createDate: message.createDate,
          text: message.text,
          fromUserList
        }
      } )
      .value()
    
    return _.get( messageList, 0 ) || {}
  },
  addMessage: async function( conn, message ) {
    let res = await common.connPromise( conn, sql.insertMessage, [ 
      message.roomId, message.sendUserId, message.text, message.createDate
    ] )

    if( !res.results.insertId ) {
      throw new Error( 'message insert fail' )
    }
    
    return res.results.insertId
  },
  addFromUser: async function( conn, messageId, fromUserIdList = [] ) {
    for( let i = 0; i < fromUserIdList.length; i++ ) {
      await common.connPromise( conn, sql.inserFromUser, [ messageId, fromUserIdList[i] ] )
    }
  },
  addChattingRoom: async function( conn, createUserId, roomUser ) {
    const now = new Date().getTime()

    let res = await common.connPromise( conn, sql.inserChattingRoom, [ createUserId, JSON.stringify( roomUser ), now ] )
    
    const insertId = _.get( res, 'results.insertId' ) 
    if( !insertId ) {
      throw new Error( 'chattingRoom insert fail' )
    }

    return insertId
  },
  readMessage: async function( conn, userId, messageIdList ) {
    const s = _.replace( sql.updateFromUser, '{{messageIdList}}', _.join( messageIdList, ', ' ) )
    await common.connPromise( conn, s, [ userId ] )
  }
}

const sql = {
  seletCattingRoom: `
    SELECT room_id, create_user_id, room_user, create_date
    FROM chatting_room
    WHERE room_id in ( {{roomIdList}} )`,
  seletUserCattingRoom: `
    SELECT room_id, create_user_id, room_user, create_date
    FROM chatting_room
    WHERE create_user_id = ?`,
  selectMessage: `
    SELECT A.message_id, A.room_id, A.send_user_id, 
      A.create_date, A.modify_date, A.text, 
      B.user_id as from_user_id, B.is_read
    FROM message as A
    INNER JOIN from_user as B on B.message_id = A.message_id
    WHERE A.message_id = ?`
  ,
  selectUserMessage: `
    SELECT A.message_id, A.room_id, A.send_user_id, 
      A.create_date, A.modify_date, A.text, 
      B.user_id as from_user_id, B.is_read
    FROM message as A
    INNER JOIN from_user as B on B.message_id = A.message_id
    WHERE A.send_user_id = ?`,
  selectFromMessage: `
    SELECT A.message_id, A.room_id, A.send_user_id, 
      A.create_date, A.modify_date, A.text, 
      B.user_id as from_user_id, B.is_read
    FROM message as A
    INNER JOIN from_user as B on B.message_id = A.message_id
    WHERE A.message_id IN ( 
      SELECT message_id 
      FROM from_user
      WHERE user_id = ? )`,
  insertMessage: `
    INSERT INTO message( room_id, send_user_id, text, create_date )
    VALUES( ?, ?, ?, ? )`,
  inserFromUser: `
    INSERT INTO from_user( message_id, user_id )
    VALUES( ?, ? )`,
  inserChattingRoom: `
    INSERT INTO chatting_room( create_user_id, room_user, create_date )
    VALUES( ?, ?, ? )`,
  updateFromUser: `
    UPDATE from_user
    SET is_read = 1
    WHERE user_id = ? AND message_id IN ( {{messageIdList}} )`
}