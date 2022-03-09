const { Server } = require( 'socket.io' )
const { getRedisClient } = require( '../redis' )
const _ = require( 'lodash' )
const redisClient = getRedisClient()
let socketIo

function conntectSocket( server ) {
  socketIo = new Server( server,  {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  } )
  socketIo.on( 'connection', socket => {
    socket.on( 'login', async ( userId ) => {
      redisClient.set( userId, socket.id )
    } )
  } )
}

async function pushMessage( pushMessageList ) {
  const socketIdList = []
  for( let i = 0; i < pushMessageList.length; i++ ) {
    const { fromUserId } = pushMessageList[i]
    const socketId = await redisClient.get( fromUserId )
    socketId && socketIdList.push( { socketId, pushMessage: pushMessageList[i] } )
  }

  for( let i = 0; i < socketIdList.length; i++ ) {
    socketIo.to( socketIdList[i].socketId ).emit( 'message', socketIdList[i].pushMessage )
  }
}

function getSocketIo() {
  return socketIo
}

module.exports = { conntectSocket, getSocketIo, pushMessage }