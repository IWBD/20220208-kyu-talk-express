const { Server } = require( 'socket.io' )
const { getRedisClient } = require( '../redis' )
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

async function pushMessage( message, fromUserIdList ) {
  const socketIdList = []
  for( let i = 0; i < fromUserIdList.length; i++ ) {
    const socketId = await redisClient.get( fromUserIdList[i] )
    socketId && socketIdList.push( socketId )
  }

  for( let i = 0; i < socketIdList.length; i++ ) {
    socketIo.to( socketIdList[i] ).emit( 'message', message )
  }
}

function getSocketIo() {
  return socketIo
}

module.exports = { conntectSocket, getSocketIo, pushMessage }